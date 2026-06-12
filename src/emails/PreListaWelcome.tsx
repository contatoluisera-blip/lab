import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface PreListaWelcomeProps {
  firstName: string;
}

export const PreListaWelcome = ({ firstName = 'Creator' }: PreListaWelcomeProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo à pré-lista exclusiva da Creator Lab!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Header */}
          <Section style={header}>
            <Img
              src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/creator%20lab%20verde.png?alt=media&token=8733334d-95bf-4f7c-85e1-6916cda0856f"
              width="120"
              height="auto"
              alt="Creator Lab"
              style={logoImage}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>
              Fala, {firstName}! Bem-vindo ao laboratório.
            </Heading>
            
            <Text style={paragraph}>
              Você acaba de garantir o seu lugar na <strong>pré-lista exclusiva</strong> da Creator Lab. Isso significa que você já está na frente.
            </Text>

            <Text style={paragraph}>
              Quando a gente fala sobre criar pelo celular, não é só sobre baixar um app e apertar gravar. É sobre transformar o seu celular numa máquina de fazer grana, com processo, estrutura e escala.
            </Text>

            <Text style={paragraph}>
              Na Creator Lab, você não vai apenas aprender a editar. Você vai ter acesso a:
            </Text>

            <ul style={list}>
              <li style={listItem}><strong>Cursos completos:</strong> Captação, Iluminação, CapCut, Node Video.</li>
              <li style={listItem}><strong>Ferramentas de ouro:</strong> Diagnóstico de perfil, Calculadora de Orçamentos e Gerador de Propostas.</li>
              <li style={listItem}><strong>Assistente de IA 24h:</strong> Para destravar seus roteiros e dúvidas técnicas na hora.</li>
            </ul>

            <Text style={paragraph}>
              Fica de olho neste e-mail. Como membro da pré-lista, você será um dos primeiros a receber o link oficial de acesso com a <strong>condição exclusiva de fundador</strong> (o menor preço da nossa história, que nunca mais vai se repetir).
            </Text>

            <Text style={paragraph}>
              A gente se vê em breve.
            </Text>

            <Text style={signature}>
              Abraço,<br />
              <strong>Luisera</strong><br />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Idealizador da Creator Lab</span>
            </Text>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Creator Lab. Todos os direitos reservados.
            </Text>
            <Text style={footerText}>
              Você está recebendo este e-mail porque se cadastrou na nossa pré-lista.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PreListaWelcome;

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
