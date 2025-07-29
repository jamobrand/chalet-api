import { Router } from 'express';
import { addonController } from './addon.module';

const addonRoutes = Router();

addonRoutes.get('/all-addons', addonController.getAddons);
addonRoutes.get('/:id', addonController.getAddon);
addonRoutes.post('/create-addon', addonController.createAddon);
addonRoutes.patch('/update-addon/:id', addonController.updateAddon);

export default addonRoutes;
