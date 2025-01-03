import { Router } from 'express';
import { reservationController } from './reservation.module';

const reservationRoutes = Router();

reservationRoutes.get('/all-reservations', reservationController.getReservations);
reservationRoutes.get('/:id', reservationController.getReservation);

export default reservationRoutes;