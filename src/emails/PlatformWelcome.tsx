import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface PlatformWelcomeProps {
  firstName: string;
  planName: string;    // 'Start' | 'Pro' | 'Elite'
  planPrice: string;   // 'R$ 67/mês' etc.
  credits: number;     // créditos do plano
  hasCourses: boolean; // Elite tem cursos
  dashboardUrl?: string;
}

export const PlatformWelcome = ({
  firstName = 'Creator',
  planName = 'Start',
  planPrice = 'R$ 67/mês',
  credits = 20,
  hasCourses = false,
  dashboardUrl = 'https://creatorlab.luisera.com.br/dashboard',
}: PlatformWelcomeProps) => {
  const planEmoji: Record<string, string> = {
    Start: '🚀',
    Pro: '⚡',
    Elite: '👑',
  };

  const tools = [
    { label: 'Diagnóstico de Perfil', available: true },
    { label: 'Calculadora de Orçamento', available: true },
    { label: 'Gerador de Ideias', available: true },
    { label: 'Gerador de Proposta Comercial', available: planName === 'Pro' || planName === 'Elite' },
    { label: 'Gestão de Clientes', available: planName === 'Pro' || planName === 'Elite' },
    { label: 'Assistente de IA 24h', available: true },
    { label: 'Cursos & Aulas com Luisera', available: hasCourses },
  ];

  return (
    <Html>
      <Head />
      <Preview>
        {planEmoji[planName] || '🎉'} Seu acesso à Creator Lab está liberado, {firstName}!
      </Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img
              src="https://firebasestorage.googleapis.com/v0/b/luisera-lab.firebasestorage.app/o/creator%20lab%20verde.png?alt=media&token=8733334d-95bf-4f7c-85e1-6916cda0856f"
              width="120"
              height="auto"
              alt="Creator Lab"
              style={logoImage}
            />
          </Section>

          {/* Plano badge */}
          <Section style={{ textAlign: 'center', marginBottom: '8px' }}>
            <Text style={planBadge}>
              PLANO {planName.toUpperCase()} — {planPrice}
            </Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={heading}>
              {planEmoji[planName] || '🎉'} É hoje, {firstName}. Seu acesso está liberado.
            </Heading>

            <Text style={paragraph}>
              Pagamento confirmado, conta ativa, ferramentas desbloqueadas. Bem-vindo(a) à <strong>Creator Lab</strong> — o sistema que vai transformar a forma como você cria, precifica e fecha contratos pelo celular.
            </Text>

            <Text style={paragraph}>
              Você entrou no plano <strong>{planName}</strong> e tem <strong>{credits} créditos</strong> disponíveis este mês para usar nas ferramentas de IA da plataforma.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={ctaButton} href={dashboardUrl}>
                Acessar meu painel agora →
              </Button>
            </Section>

            <Hr style={hrLight} />

            {/* O que está liberado */}
            <Text style={sectionTitle}>O que está liberado no seu plano:</Text>

            <Section style={toolsGrid}>
              {tools.map((tool) => (
                <Row key={tool.label} style={toolRow}>
                  <Column style={toolIconCol}>
                    <Text style={tool.available ? checkStyle : crossStyle}>
                      {tool.available ? '✅' : '—'}
                    </Text>
                  </Column>
                  <Column>
                    <Text style={tool.available ? toolLabelActive : toolLabelInactive}>
                      {tool.label}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={hrLight} />

            {/* Por onde começar */}
            <Text style={sectionTitle}>Por onde começar:</Text>

            <Row style={stepRow}>
              <Column style={stepNumberCol}>
                <Text style={stepNumber}>1</Text>
              </Column>
              <Column>
                <Text style={stepText}>
                  <strong>Diagnóstico de Perfil</strong> — Analise o @ de um cliente em potencial e entre na conversa já sabendo exatamente o que ele precisa.
                </Text>
              </Column>
            </Row>

            <Row style={stepRow}>
              <Column style={stepNumberCol}>
                <Text style={stepNumber}>2</Text>
              </Column>
              <Column>
                <Text style={stepText}>
                  <strong>Calculadora de Orçamento</strong> — Monte um orçamento justo, com dados, e nunca mais fique inseguro com o preço que você cobra.
                </Text>
              </Column>
            </Row>

            <Row style={stepRow}>
              <Column style={stepNumberCol}>
                <Text style={stepNumber}>3</Text>
              </Column>
              <Column>
                <Text style={stepText}>
                  <strong>Assistente de IA</strong> — Pergunte qualquer coisa sobre CapCut, Node Video, roteiro, negociação com cliente. Ele está disponível 24h.
                </Text>
              </Column>
            </Row>

            <Hr style={hrLight} />

            <Text style={paragraph}>
              Se tiver qualquer dúvida sobre a plataforma, pode responder este e-mail diretamente ou falar comigo pelas redes.
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
              Você está recebendo este e-mail porque realizou uma assinatura na Creator Lab.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default PlatformWelcome;

// ─── Styles ────────────────────────────────────────────────────

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

const planBadge = {
  display: 'inline-block',
  backgroundColor: '#10b981',
  color: '#000000',
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  padding: '4px 12px',
  borderRadius: '999px',
  textAlign: 'center' as const,
};

const content = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  borderRadius: '12px',
  padding: '40px',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#ffffff',
  marginTop: '0',
  marginBottom: '24px',
  lineHeight: '1.3',
};

const paragraph = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#d1d5db',
  marginBottom: '20px',
};

const sectionTitle = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#10b981',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  marginBottom: '12px',
  marginTop: '24px',
};

const ctaButton = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
};

const hrLight = {
  borderColor: '#222222',
  margin: '24px 0',
};

const hr = {
  borderColor: '#222222',
  margin: '32px 0',
};

const toolsGrid = {
  marginBottom: '8px',
};

const toolRow = {
  marginBottom: '8px',
};

const toolIconCol = {
  width: '28px',
};

const checkStyle = {
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.4',
};

const crossStyle = {
  fontSize: '14px',
  color: '#374151',
  margin: '0',
  lineHeight: '1.4',
};

const toolLabelActive = {
  fontSize: '14px',
  color: '#d1d5db',
  margin: '0',
  lineHeight: '1.4',
};

const toolLabelInactive = {
  fontSize: '14px',
  color: '#374151',
  margin: '0',
  lineHeight: '1.4',
};

const stepRow = {
  marginBottom: '16px',
};

const stepNumberCol = {
  width: '36px',
};

const stepNumber = {
  backgroundColor: '#10b981',
  color: '#000000',
  borderRadius: '999px',
  width: '24px',
  height: '24px',
  fontSize: '12px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  lineHeight: '24px',
  margin: '0',
  display: 'block',
};

const stepText = {
  fontSize: '14px',
  color: '#d1d5db',
  lineHeight: '1.6',
  margin: '0',
};

const signature = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#ffffff',
  marginTop: '32px',
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
