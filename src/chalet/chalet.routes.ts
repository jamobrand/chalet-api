import { Router } from 'express';
import { chaletController } from './chalet.module';

const chaletRoutes = Router();

chaletRoutes.post('/create', chaletController.createChalet);
chaletRoutes.patch('/edit/:chaletId', chaletController.editChalet);
chaletRoutes.get('/all-chalets', chaletController.getChalets);
chaletRoutes.post('/search', chaletController.searchChalets);
chaletRoutes.post('/search/room', chaletController.searchChaletsByRoom);
chaletRoutes.get('/:id', chaletController.getChalet);
chaletRoutes.delete('/admin/delete/:chaletId', chaletController.deleteChalet);
chaletRoutes.get('/home/chalets', chaletController.getChaletsHome);
chaletRoutes.post('/booking/reserve-chalet', chaletController.reserveChalet);

export default chaletRoutes;
