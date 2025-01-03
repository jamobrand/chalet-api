import { Router } from 'express';
import { chaletController } from './chalet.module';

const chaletRoutes = Router();

chaletRoutes.post('/create', chaletController.createChalet);
chaletRoutes.get('/all-chalets', chaletController.getChalets);
chaletRoutes.post('/search', chaletController.searchChalets);
chaletRoutes.get('/:id', chaletController.getChalet);
chaletRoutes.get('/home/chalets', chaletController.getChaletsHome);
chaletRoutes.post('/booking/reserve-chalet', chaletController.reserveChalet);

export default chaletRoutes;

// /booking/reserve-chalet