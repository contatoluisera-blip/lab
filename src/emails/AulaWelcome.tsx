import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

interface AulaWelcomeProps {
  firstName: string;
  aulaUrl: string;
}

/** Enviado quando a pessoa libera a aula em /aula: link de volta e aviso da aula de personagens. */
export const AulaWelcome = ({ firstName = 'Creator', aulaUrl = 'https://labcreator.com.br/aula' }: AulaWelcomeProps) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://labcreator.com.br';
  return (
    <Html>
      <Head />
      <Preview>Sua aula está liberada. E vem mais uma por aí.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={`${appUrl}/img/logo-verde.png`} width="120" height="auto" alt="Creator Lab" style={logoImage} />
          </Section>

          <Section style={content}>
            <Heading style={heading}>Fala, {firstName}! Sua aula está liberada.</Heading>

            <Text style={paragraph}>
              Se fechou a página sem querer, o link fica aqui para você assistir quando quiser:
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '8px 0 28px' }}>
              <Button href={aulaUrl} style={button}>Assistir à aula</Button>
            </Section>

            <Text style={paragraph}>
              E tem mais: nos próximos dias você recebe aqui no e-mail uma <strong>aula mostrando como eu crio personagens com IA</strong> dentro da Creator Lab, do primeiro frame ao vídeo pronto.
            </Text>

            <Text style={paragraph}>Enquanto isso, um resumo do que dá para fazer lá dentro:</Text>
            <ul style={list}>
              <li style={listItem}><strong>Prompt a partir de uma ideia simples:</strong> você escreve em português, do seu jeito, e sai a direção de cena pronta.</li>
              <li style={listItem}><strong>Os principais motores de IA num lugar só:</strong> Kling, Seedance, Veo, Nano Banana, GPT Image e outros.</li>
              <li style={listItem}><strong>Do roteiro à proposta:</strong> ideias, geração de imagem, vídeo e áudio, orçamento e proposta para o cliente.</li>
            </ul>

            <Text style={signature}>
              Abraço,<br />
              <strong>Luisera</strong><br />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Idealizador da Creator Lab</span>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© 2026 Creator Lab. Todos os direitos reservados.</Text>
            <Text style={footerText}>Você está recebendo este e-mail porque liberou a aula em labcreator.com.br e aceitou receber nossos materiais.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AulaWelcome;

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
