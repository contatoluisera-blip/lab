// Config do Remotion CLI (Studio e `npm run video:*`). A chave pública não é segredo;
// a privada (REMOTION_LICENSE_KEY) fica só no servidor, em src/lib/server/render/lambda.ts.
import { Config } from '@remotion/cli/config';

Config.setPublicLicenseKey('rm_pub_ba902c7ce942c9c5317960f37fe845087d7cf56d11059845');
