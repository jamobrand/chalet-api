import { AddonController } from './addon.controller';
import { AddonsService } from './addons.service';

const addonsService = new AddonsService();
const addonController = new AddonController(addonsService);

export { addonsService, addonController };
