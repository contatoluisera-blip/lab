import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface KitWelcomeProps {
  firstName: string;
  kitTitle: string;
  kitUrl: string;
  unsubscribeUrl?: string;
}

/** Enviado quando a pessoa libera um kit de prompts em /kit/{slug}: o link para voltar ao kit. */
export const KitWelcome = ({ firstName = 'Creator', kitTitle = 'seu kit', kitUrl = 'https://labcreator.com.br', unsubscribeUrl }: KitWelcomeProps) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://labcreator.com.br';
  return (
    <Html>
      <Head />
      <Preview>{`Seu kit está liberado: ${kitTitle}. O link fica aqui.`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${appUrl}/img/logo-verde.png`} width="120" height="auto" alt="Creator Lab" style={logoImage} />
          </Section>

          <Section style={content}>
            <Heading style={heading}>Fala, {firstName}! Seu kit está liberado.</Heading>

            <Text style={paragraph}>
              <strong>{kitTitle}</strong>: todos os prompts, as imagens de cada etapa e a ordem da montagem. Guarde este e-mail para voltar quando quiser:
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '8px 0 28px' }}>
              <Button href={kitUrl} style={button}>Abrir o kit</Button>
            </Section>

            <Text style={paragraph}>
              Os prompts foram feitos na Creator Lab, com os mesmos modelos que você encontra lá dentro: GPT Image, Seedance, Kling, Veo, Nano Banana e outros, no mesmo saldo e em reais.
            </Text>

            <Text style={paragraph}>
              E fica de olho no seu e-mail: por aqui você vai receber mais materiais, como <strong>novos kits</strong>, <strong>aulas extras</strong> e <strong>condições especiais</strong>.
            </Text>

            <Text style={signature}>
              Abraço,<br />
              <strong>Luisera</strong><br />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Idealizador da Creator Lab</span>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© 2026 Creator Lab. Todos os direitos reservados.</Text>
            <Text style={footerText}>Você está recebendo este e-mail porque liberou um kit em labcreator.com.br e aceitou receber nossos materiais.</Text>
            {unsubscribeUrl && <Text style={footerText}><Link href={unsubscribeUrl} style={{ color: '#6b7280', textDecoration: 'underline' }}>Não quero mais receber estes e-mails</Link></Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default KitWelcome;

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
