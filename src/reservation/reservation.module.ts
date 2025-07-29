import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';

const reservationService = new ReservationService();
const reservationController = new ReservationController(reservationService);

export { reservationService, reservationController };
