import { NextResponse } from 'next/server';
import { adminAuth, adminDb, isAdminReady } from '@/lib/firebase/admin';
import { planCredits, PlanId } from '@/lib/planConfig';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planName, price, paymentMethod, customer, cardData } = body;

    // 0. Check Firebase Admin is configured
    if (!isAdminReady) {
      return NextResponse.json(
        { success: false, error: 'Configuração do servidor incompleta: credenciais Firebase Admin ausentes. Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local.' },
        { status: 503 }
      );
    }

    // 1. Validations
    if (!planName || !price || !paymentMethod || !customer) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PAGARME_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Chave de API do Pagar.me não configurada no servidor.' },
        { status: 500 }
      );
    }

    // Convert price to cents (R$ 79.00 -> 7900)
    const amountInCents = Math.round(Number(price) * 100);

    // Clean CPF/CNPJ and Phone numbers
    const cleanDocument = customer.document.replace(/\D/g, '');
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phoneArea = cleanPhone.substring(0, 2) || '11';
    const phoneNumber = cleanPhone.substring(2) || '999999999';

    // 2. Base payload structure for Pagar.me V5 Orders API
    const pagarmePayload: any = {
      customer: {
        name: customer.name,
        email: customer.email,
        document: cleanDocument,
        type: cleanDocument.length > 11 ? 'company' : 'individual',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: phoneArea,
            number: phoneNumber
          }
        }
      },
      items: [
        {
          amount: amountInCents,
          description: `Assinatura Creator Lab - Plano ${planName}`,
          quantity: 1,
          code: `plan_${planName.toLowerCase()}`
        }
      ],
      payments: []
    };

    // 3. Populate specific payment method parameters
    if (paymentMethod === 'credit_card') {
      if (!cardData) {
        return NextResponse.json(
          { success: false, error: 'Dados do cartão de crédito ausentes.' },
          { status: 400 }
        );
      }

      pagarmePayload.payments.push({
        payment_method: 'credit_card',
        credit_card: {
          recurrence: false,
          installments: Number(cardData.installments) || 1,
          statement_descriptor: 'CREATORLAB',
          card: {
            number: cardData.number.replace(/\s+/g, ''),
            holder_name: cardData.holderName,
            exp_month: Number(cardData.expMonth),
            exp_year: Number(cardData.expYear),
            cvv: cardData.cvv,
            billing_address: {
              line_1: '1000, Avenida Paulista',
              zip_code: '01311000',
              city: 'São Paulo',
              state: 'SP',
              country: 'BR',
              neighborhood: 'Bela Vista'
            }
          }
        }
      });
    } else if (paymentMethod === 'pix') {
      pagarmePayload.payments.push({
        payment_method: 'pix',
        pix: {
          expires_in: 3600
        }
      });
    } else if (paymentMethod === 'boleto') {
      const dueAtDate = new Date();
      dueAtDate.setDate(dueAtDate.getDate() + 3);

      pagarmePayload.payments.push({
        payment_method: 'boleto',
        boleto: {
          instructions: 'Pagar até o vencimento. Liberação automática após a compensação.',
          due_at: dueAtDate.toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Método de pagamento inválido.' },
        { status: 400 }
      );
    }

    // 4. Send request to Pagar.me core v5 API
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');

    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(pagarmePayload)
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error('Erro na API Pagar.me:', resData);
      const apiErrorMessage =
        resData.message ||
        (resData.errors && Object.values(resData.errors).flat().join(', ')) ||
        'Erro ao processar transação no gateway.';
      return NextResponse.json(
        { success: false, error: apiErrorMessage, details: resData },
        { status: response.status }
      );
    }

    // 5. Format output depending on payment method
    let transactionInfo: any = {};
    const charge = resData.charges?.[0];
    const transaction = charge?.last_transaction;

    if (paymentMethod === 'credit_card') {
      transactionInfo = {
        status: charge?.status || 'failed',
        gatewayId: resData.id,
        invoiceId: charge?.id
      };
    } else if (paymentMethod === 'pix') {
      transactionInfo = {
        qrCode: transaction?.qr_code || '',
        qrCodeUrl: transaction?.qr_code_url || '',
        expiresAt: transaction?.expires_at || ''
      };
    } else if (paymentMethod === 'boleto') {
      transactionInfo = {
        pdf: transaction?.pdf || '',
        lineCode: transaction?.line_code || '',
        dueAt: transaction?.due_at || ''
      };
    }

    // 6. Create Firebase user and Firestore profile via Admin SDK
    // Runs entirely server-side — bypasses all Firestore security rules
    let firebaseUid: string | null = null;
    let customToken: string | null = null;

    try {
      // Check if Auth user already exists (re-purchase scenario)
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(customer.email);
        firebaseUid = userRecord.uid;
      } catch {
        // User does not exist — create fresh account
        if (!customer.password) {
          throw new Error('Senha obrigatória para criar a conta de acesso.');
        }
        userRecord = await adminAuth.createUser({
          email: customer.email,
          password: customer.password,
          displayName: customer.name,
        });
        firebaseUid = userRecord.uid;
      }

      // Determine credits based on plan
      const planKey = planName.toLowerCase() as PlanId;
      const initialCredits = planCredits(planKey);

      // Write Firestore profile with plan-correct credits and empty trialUsed
      await adminDb.collection('users').doc(firebaseUid).set({
        uid: firebaseUid,
        name: customer.name,
        email: customer.email,
        cpf: cleanDocument,
        phone: cleanPhone,
        plan: planKey,
        credits: initialCredits,
        trialUsed: {},
        pagarmeOrderId: resData.id,
        paymentMethod,
        paymentStatus: resData.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Generate custom token so the frontend can sign in immediately
      customToken = await adminAuth.createCustomToken(firebaseUid);

    } catch (adminError: any) {
      console.error('Erro ao criar usuário no Firebase:', adminError);
      // Payment succeeded but account setup failed — give actionable message
      return NextResponse.json({
        success: false,
        error: `Pagamento realizado, mas houve um erro ao criar sua conta: ${adminError.message}. Anote o ID do pedido: ${resData.id} e contacte o suporte.`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: resData.id,
        status: resData.status,
        paymentMethod,
        paymentInfo: transactionInfo,
        customToken,   // Client signs in with signInWithCustomToken()
        firebaseUid,
      }
    });

  } catch (error: any) {
    console.error('Erro no checkout backend:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno no servidor de pagamentos.' },
      { status: 500 }
    );
  }
}
