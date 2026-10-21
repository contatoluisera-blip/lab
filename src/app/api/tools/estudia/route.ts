import { adminStorage, adminDb } from '@/lib/firebase/admin';
import { withTool } from '@/lib/server/tool';
import { HttpError } from '@/lib/server/auth';
import { AI_MODELS } from '@/lib/server/ai';

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY || '';

const PROMPT = `You are an advanced image-to-image portrait transformation engine specialized in high-end professional studio photography.

Your task is to transform the user's uploaded face image into an ultra-realistic professional studio portrait while preserving the person's identity with the highest possible fidelity.

The source image is the single source of truth for the person's identity. Any optional reference image must be used exclusively as an aesthetic reference for lighting, framing, wardrobe, background, and photographic finish. Never copy, blend, approximate, or inherit facial traits from a reference image.

Your highest priority is facial identity preservation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CORE OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate one premium studio portrait with:

- maximum facial consistency with the uploaded source image;
- an ultra-realistic photographic appearance;
- a confident, composed, and professional presence;
- a direct and firm gaze toward the camera;
- a neutral matte black shirt;
- a clean studio background;
- controlled professional lighting;
- natural skin texture;
- realistic photographic depth;
- refined but non-destructive retouching;
- no identity drift.

The final result must look like a photograph captured during a premium professional portrait session, not like an AI-generated reinterpretation of the subject.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. IDENTITY PRESERVATION — ABSOLUTE PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Preserve the person's recognizable identity with extreme precision.

Maintain the original facial anatomy, proportions, and distinctive features, including:

- overall face shape;
- head shape;
- forehead proportions;
- hairline;
- hairstyle structure;
- eyebrow shape, thickness, and spacing;
- eye shape;
- eyelid structure;
- iris color;
- distance between the eyes;
- nose width, bridge, projection, and nostril shape;
- cheekbone structure;
- facial volume;
- jawline;
- chin shape;
- lip shape, thickness, and asymmetry;
- mouth width;
- ear shape when visible;
- skin tone;
- beard, mustache, stubble, or clean-shaven appearance;
- age-related characteristics;
- visible moles, scars, freckles, birthmarks, and subtle asymmetries;
- eyewear and accessories when present, unless explicitly requested otherwise.

Do not idealize the face.

Do not reshape facial anatomy.

Do not perform aesthetic surgery.

Do not make the subject look like a different person.

Do not replace natural facial characteristics with generic beauty standards.

Do not over-symmetrize the face.

Do not excessively sharpen or enlarge the eyes.

Do not narrow or widen the nose.

Do not alter the jawline, lips, chin, cheeks, or forehead unless required solely to correct perspective distortion from the original photograph.

Preserve subtle asymmetries. They are essential for identity consistency.

If any facial detail is uncertain due to low resolution, compression, shadows, or partial occlusion, reconstruct it conservatively based on the source image. Never invent distinctive facial traits.

When there is a conflict between visual beautification and identity preservation, always preserve identity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. EXPRESSION AND GAZE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The subject must look directly into the camera with a calm, firm, confident, and professional expression.

Use:

- relaxed facial muscles;
- a subtle sense of authority;
- neutral or almost-neutral lips;
- no exaggerated smile;
- no aggressive expression;
- no artificial model pose;
- no forced charisma;
- no excessive eyebrow tension;
- no dramatic emotion.

The expression should communicate competence, trust, seriousness, and presence.

Preserve the person's natural facial identity while gently correcting the gaze toward the camera when necessary.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. POSE AND COMPOSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a professional head-and-shoulders studio portrait.

Preferred framing:

- horizontal landscape orientation;
- 16:9 aspect ratio;
- subject centered or subtly offset;
- face occupying a significant portion of the frame;
- crop between the upper chest and mid-torso;
- sufficient space above the head;
- shoulders naturally positioned;
- posture upright but relaxed;
- head slightly turned or nearly frontal;
- eyes aligned close to the upper third of the frame;
- camera positioned at eye level.

The final composition must prioritize the face.

Avoid:

- wide-angle distortion;
- extreme close-ups;
- excessive empty space;
- fashion-editorial body poses;
- tilted head angles that alter facial recognition;
- exaggerated shoulder rotation;
- unnatural neck proportions;
- cinematic poses that reduce clarity of the face.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. WARDROBE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the original clothing with a simple, premium, neutral black shirt.

The shirt must be:

- matte black;
- plain;
- elegant;
- minimalist;
- without logos;
- without text;
- without graphics;
- without visible branding;
- without excessive folds;
- without distracting textures;
- without jewelry unless present in the original image and relevant to the person's identity.

Preferred wardrobe:

- black crew-neck shirt;
- black premium cotton or soft matte fabric;
- clean neckline;
- realistic fabric texture;
- natural draping around shoulders and chest.

The clothing must not compete visually with the face.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. PROFESSIONAL STUDIO LIGHTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use refined professional portrait lighting.

Lighting setup:

- one large soft key light positioned approximately 35 to 45 degrees from the subject;
- soft directional illumination across the face;
- subtle shadow transition on the opposite side;
- gentle fill light to preserve facial detail;
- discreet separation light or rim light around the hair and shoulders when appropriate;
- realistic catchlights in the eyes;
- controlled contrast;
- natural three-dimensional facial modeling;
- balanced exposure;
- no clipped highlights;
- no crushed facial shadows.

The lighting must enhance facial structure without modifying anatomy.

Use a premium commercial portrait aesthetic with a cinematic but realistic finish.

Avoid:

- harsh beauty-dish shadows;
- overexposed skin;
- flat lighting;
- colored light cast on the skin;
- artificial glow;
- excessive orange skin tones;
- neon lighting;
- heavy HDR;
- plastic skin;
- dramatic shadows that hide identity-critical facial details.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. BACKGROUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a clean and elegant studio background.

Preferred visual direction:

- dark neutral background;
- black, deep charcoal, dark brown, or subtle warm gradient;
- soft amber glow behind the subject when suitable;
- gradual tonal transition;
- discreet separation between subject and background;
- no visible environment;
- no props;
- no furniture;
- no studio equipment;
- no objects;
- no text;
- no logos;
- no visual clutter.

The background must remain secondary to the face.

It may include a subtle warm amber halo or a restrained orange gradient behind the subject, inspired by premium editorial studio portrait photography, while keeping the overall image sophisticated and realistic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. CAMERA AND PHOTOGRAPHIC LANGUAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Simulate a professional full-frame camera portrait.

Recommended photographic characteristics:

- full-frame camera rendering;
- 85 mm portrait lens equivalent;
- natural perspective compression;
- realistic facial proportions;
- eye-level camera angle;
- shallow but controlled depth of field;
- aperture appearance equivalent to approximately f/2.8 to f/4;
- sharp focus on the eyes;
- clear eyelashes and eyebrows;
- detailed but natural skin texture;
- smooth background falloff;
- premium editorial portrait finish;
- realistic dynamic range;
- subtle lens character;
- no excessive digital sharpening.

The image must feel optically plausible.

Avoid:

- smartphone computational photography appearance;
- fisheye distortion;
- wide-angle facial deformation;
- excessive bokeh;
- fake lens blur around the hair;
- unnatural depth maps;
- inconsistent focus;
- overprocessed HDR.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. SKIN TEXTURE AND RETOUCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply high-end editorial retouching while maintaining realism.

Preserve:

- pores;
- fine skin texture;
- natural facial lines;
- subtle under-eye detail;
- realistic tonal variation;
- authentic facial volume;
- natural highlights;
- minor imperfections that contribute to identity.

Correct only:

- temporary blemishes when visually distracting;
- excessive shine;
- color imbalance;
- harsh compression artifacts;
- minor exposure issues;
- photographic noise;
- small distractions unrelated to identity.

Do not:

- erase pores;
- smooth the face excessively;
- create wax-like skin;
- remove permanent facial details;
- make the skin unnaturally flawless;
- add artificial makeup;
- whiten teeth unless visible and necessary;
- modify skin tone;
- remove age characteristics;
- alter facial structure through retouching.

The result must resemble professional frequency-separation retouching performed with restraint.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. HAIR, FACIAL HAIR, AND EYEWEAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Preserve the subject's original hair identity.

Maintain:

- hairline;
- hairstyle;
- texture;
- density;
- curl pattern;
- natural volume;
- beard pattern;
- mustache shape;
- stubble density;
- sideburn structure.

Improve grooming only subtly.

Do not generate a different haircut.

Do not increase hair volume artificially.

Do not remove facial hair unless explicitly instructed.

If the subject wears glasses:

- preserve the glasses whenever they contribute to the person's identity;
- retain the general frame shape, size, position, and color;
- maintain realistic reflections;
- reduce distracting glare when necessary;
- keep both eyes clearly visible whenever physically plausible;
- avoid warped frames;
- avoid asymmetrical lenses;
- avoid floating temples;
- avoid unrealistic reflections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. SOURCE IMAGE HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adapt intelligently to the uploaded source image.

If the original image has:

- poor lighting: correct the lighting while preserving facial geometry;
- a distracting background: replace it completely;
- low resolution: enhance detail conservatively;
- an informal pose: reposition the body while preserving the face;
- a side angle: gently move toward a nearly frontal portrait only when facial consistency can be maintained;
- glasses: preserve them unless otherwise instructed;
- visible accessories: preserve only those relevant to identity;
- strong shadows: recover detail without inventing new facial traits;
- partial face occlusion: reconstruct cautiously and prioritize likeness;
- a smile: neutralize it gently while maintaining the same person;
- casual clothing: replace it with the neutral black shirt;
- an unsuitable crop: extend the upper torso realistically.

If the face is heavily occluded, extremely blurred, or too small to reconstruct reliably, prioritize conservative enhancement rather than aggressive generation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. REALISM REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The final image must be indistinguishable from a real professional portrait photograph.

Ensure:

- anatomically correct face;
- natural neck width;
- realistic shoulders;
- correct ear placement;
- realistic hair strands;
- consistent glasses geometry when applicable;
- symmetrical but natural pupils;
- realistic iris texture;
- natural sclera color;
- coherent shadows;
- accurate light direction;
- realistic clothing folds;
- plausible skin highlights;
- consistent depth of field;
- no generative artifacts;
- no AI hallucinations;
- no facial blending;
- no identity replacement.

The result should look like the same person photographed in a controlled studio session on a different day.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. PROHIBITED CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Never:

- create a different person;
- mix identities;
- approximate the face based on a reference person;
- modify ethnicity;
- modify apparent age;
- modify gender presentation;
- alter body proportions unnecessarily;
- exaggerate attractiveness;
- add makeup without instruction;
- reshape the face;
- sharpen the face excessively;
- over-retouch the skin;
- generate an artificial smile;
- add text;
- add watermark;
- add logos;
- add jewelry not present in the source;
- add props;
- add hands unless composition requires them;
- create visible studio equipment;
- apply painterly, illustrative, 3D, or synthetic aesthetics.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. DECISION HIERARCHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always follow this priority order:

1. Preserve the subject's identity.
2. Preserve distinctive facial details.
3. Maintain anatomical realism.
4. Keep the gaze directed toward the camera.
5. Apply a professional studio portrait composition.
6. Use a neutral black shirt.
7. Apply refined studio lighting.
8. Improve image quality conservatively.
9. Add aesthetic polish only when it does not reduce likeness.

If any aesthetic instruction compromises identity preservation, ignore the aesthetic instruction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. FINAL OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a single final portrait image.

The final image must show:

- the same person as the uploaded image;
- maximum identity fidelity;
- a firm and direct gaze into the camera;
- a calm and professional facial expression;
- a plain matte black shirt;
- a clean premium studio background;
- realistic soft directional studio lighting;
- natural skin texture;
- sharp eyes;
- a premium full-frame portrait photography aesthetic;
- no visible AI artifacts;
- no text, logos, or watermark.

Output only the final transformed image.`;

/**
 * Inicia a geração da foto de estúdio: sobe a selfie para o Storage, abre a tarefa na KIE
 * e devolve o taskId para o navegador acompanhar em /status.
 * O crédito é cobrado aqui; se a KIE falhar depois, a rota de status devolve.
 */
export const POST = withTool('estudia', async ({ body, user, charge }) => {
  const image: string = body.image;
  if (!image) throw new HttpError(400, 'missing_image', 'Envie uma foto antes de gerar.');
  if (!KIE_AI_API_KEY) throw new HttpError(503, 'provider_unconfigured', 'A chave da KIE AI não está configurada no servidor.');

  let publicUrl = image;

  if (image.startsWith('data:image')) {
    if (!adminStorage) throw new HttpError(503, 'server_misconfigured', 'Armazenamento de imagens indisponível no servidor.');

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new HttpError(400, 'bad_image', 'A foto enviada está num formato inválido.');

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024) throw new HttpError(400, 'image_too_large', 'A foto passa de 8 MB. Envie uma versão menor.');

    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = `estudia/${user.uid}_${Date.now()}.${ext}`;

    try {
      const file = adminStorage.bucket().file(fileName);
      await file.save(buffer, { metadata: { contentType: mimeType } });
      const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
      publicUrl = signedUrl;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (/billing/i.test(msg)) {
        throw new HttpError(503, 'storage_billing', 'O armazenamento de imagens está desativado por falta de faturamento no Google Cloud. Avise o suporte.');
      }
      console.error('[estudia] falha ao salvar no Storage:', msg);
      throw new HttpError(502, 'storage_error', 'Não foi possível guardar a foto para processamento. Tente de novo.');
    }
  }

  const payload = {
    model: AI_MODELS.kieImage,
    input: {
      prompt: PROMPT,
      image_input: [publicUrl],
      aspect_ratio: '16:9',
      resolution: '1K',
      output_format: 'jpg',
    },
  };

  const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KIE_AI_API_KEY}` },
    body: JSON.stringify(payload),
  });
  const createData = await response.json().catch(() => ({}));

  if (createData.code !== 200 || !createData.data?.taskId) {
    console.error('[estudia] KIE createTask:', createData);
    const msg = String(createData.msg || '');
    if (/credit|balance|insufficient/i.test(msg)) throw new HttpError(502, 'provider_quota', 'A conta da KIE AI está sem saldo. Avise o suporte.');
    if (response.status === 401 || /unauthorized|invalid.*key/i.test(msg)) throw new HttpError(502, 'provider_auth', 'A chave da KIE AI foi recusada. Avise o suporte.');
    throw new HttpError(502, 'provider_error', 'A KIE AI não aceitou o pedido agora. Seu crédito foi devolvido; tente de novo.');
  }

  const taskId: string = createData.data.taskId;

  await adminDb.collection('estudia').doc(taskId).set({
    userId: user.uid,
    taskId,
    status: 'processing',
    sourceUrl: publicUrl,
    resultUrl: null,
    chargedCredits: charge.charged,
    refunded: false,
    createdAt: new Date().toISOString(),
  });

  return { taskId };
}, { logDescription: () => 'Solicitou geração de foto de estúdio (IA)' });
