import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';
import { AULA_OFFER, PLAN_CONFIGS, aulaOfferCharge, cycleTotal, formatBRL } from '@/lib/planConfig';

interface AulaOfferProps {
  firstName: string;
  offerUrl: string;
  unsubscribeUrl?: string;
}

/** Segundo e-mail do lead da aula: lembra a condição exclusiva (50% nos 3 primeiros meses) com um mini pitch. */
export const AulaOffer = ({ firstName = 'Creator', offerUrl = 'https://labcreator.com.br/aula#oferta', unsubscribeUrl }: AulaOfferProps) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://labcreator.com.br';
  return (
    <Html>
      <Head />
      <Preview>50% de desconto nos 3 primeiros meses: a condição de quem assistiu à aula.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${appUrl}/img/logo-verde.png`} width="120" height="auto" alt="Creator Lab" style={logoImage} />
          </Section>

          <Section style={content}>
            <Heading style={heading}>{firstName}, agora é a hora de colocar a aula em prática.</Heading>

            <Text style={paragraph}>
              Você viu na aula o que dá para fazer. A diferença entre assistir e entregar é ter as ferramentas certas na mão. E este é o momento mais barato para começar.
            </Text>

            <Section style={offerBox}>
              <Text style={offerTag}>Condição de quem assistiu à aula</Text>
              <Text style={offerTitle}>50% de desconto nos 3 primeiros meses</Text>
              {AULA_OFFER.plans.map(id => (
                <Text key={id} style={offerRow}>
                  <strong style={{ color: '#ffffff' }}>{PLAN_CONFIGS[id].label}:</strong>{' '}
                  {formatBRL(aulaOfferCharge(id, 'monthly'))}/mês{' '}
                  <span style={{ color: '#6b7280', textDecoration: 'line-through' }}>{formatBRL(cycleTotal(id, 'monthly'))}</span>
                </Text>
              ))}
              <Text style={offerNote}>Também vale no trimestral (1º trimestre pela metade) e no anual (3 meses pela metade).</Text>
            </Section>

            <Section style={{ textAlign: 'center' as const, margin: '8px 0 28px' }}>
              <Button href={offerUrl} style={button}>Quero meus 50% de desconto</Button>
            </Section>

            <Text style={paragraph}>O que você leva:</Text>
            <ul style={list}>
              <li style={listItem}><strong>Sua ideia vira prompt com direção:</strong> escreve em português, sai câmera, lente e luz definidas.</li>
              <li style={listItem}><strong>Kling, Seedance, Veo, Nano Banana e GPT Image</strong> no mesmo saldo, em reais, sem assinatura em dólar.</li>
              <li style={listItem}><strong>Roteiro, imagem, vídeo, voz e montagem</strong> no mesmo fluxo.</li>
              <li style={listItem}><strong>Orçamento e proposta</strong> para cobrar melhor pelo que você entrega.</li>
              <li style={listItem}><strong>Treinamentos de criação mobile e criação com IA</strong> com Luisera, no plano Elite.</li>
              <li style={listItem}><strong>Sem fidelidade:</strong> cancela quando quiser, pela própria plataforma.</li>
            </ul>

            <Text style={paragraph}>
              Essa condição é só para quem veio da aula: ela não aparece na página principal. Quanto antes você começar, mais rápido a sua primeira entrega com IA sai do papel.
            </Text>

            <Text style={signature}>
              Abraço,<br />
              <strong>Luisera</strong><br />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Idealizador da Creator Lab</span>
            </Text>
            <Text style={{ ...paragraph, fontSize: '14px', color: '#9ca3af', marginTop: '24px' }}>
              P.S.: ficou com alguma dúvida? É só responder este e-mail.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© 2026 Creator Lab. Todos os direitos reservados.</Text>
            <Text style={footerText}>Você está recebendo este e-mail porque liberou a aula em labcreator.com.br e aceitou receber nossos materiais.</Text>
            {unsubscribeUrl && <Text style={footerText}><Link href={unsubscribeUrl} style={{ color: '#6b7280', textDecoration: 'underline' }}>Não quero mais receber estes e-mails</Link></Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AulaOffer;

const offerBox = {
  backgroundColor: '#06261b',
  border: '1px solid #10b98155',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '8px 0 20px',
};
const offerTag = { fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#6ee7b7', fontWeight: 'bold', margin: '0 0 6px' };
const offerTitle = { fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 14px', lineHeight: '1.3' };
const offerRow = { fontSize: '15px', color: '#d1d5db', margin: '0 0 6px' };
const offerNote = { fontSize: '13px', color: '#9ca3af', margin: '12px 0 0', lineHeight: '1.5' };

const button = {
  backgroundColor: '#10b981',
  color: '#03140d',
  fontWeight: 'bold',
  fontSize: '15px',
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
};

const main = {
  backgroundColor: '#050505',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
};

const header = {
  padding: '24px 0',
  textAlign: 'center' as const,
};

const logoImage = {
  margin: '0 auto',
};

const content = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  borderRadius: '12px',
  padding: '40px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  marginTop: '0',
  marginBottom: '24px',
  lineHeight: '1.3',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#d1d5db',
  marginBottom: '20px',
};

const list = {
  color: '#d1d5db',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '20px',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '10px',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#ffffff',
  marginTop: '32px',
};

const hr = {
  borderColor: '#222222',
  margin: '32px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '0 0 4px',
};
