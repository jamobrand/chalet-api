import { bookingService } from '../booking/booking.module';
import { DpoController } from '../dpo-payment/dpo.controller';
import { DPOService } from '../dpo-payment/dpo.service';

const dpoService = new DPOService();
const dpoController = new DpoController(dpoService, bookingService);

export { dpoController, dpoService };
