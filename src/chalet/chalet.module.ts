import { ChaletController } from './chalet.controller';
import { ChaletService } from './chalet.service';

const chaletService = new ChaletService();
const chaletController = new ChaletController(chaletService);

export { chaletService, chaletController };
