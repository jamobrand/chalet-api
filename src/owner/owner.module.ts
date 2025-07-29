import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';

const ownerService = new OwnerService();
const ownerController = new OwnerController(ownerService);

export { ownerService, ownerController };
