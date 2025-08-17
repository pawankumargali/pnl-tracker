import { Request, Response, Express, NextFunction } from 'express';
import tradeRouter from './trade.router.js';
import positionRouter from './position.router.js';
import { APIError } from '../middleware/error.middleware.js';

export default function initRoutes(app: Express) {

     //trade router - used to record and list trades
     app.use('/api', tradeRouter);

     //position router - used to get holdings & PnL
     app.use('/api', positionRouter);

    //health check route
    app.get('/health', (_: Request, res: Response) =>  res.status(200).json({status: 'OK'}));

    // throw 404 error when route is not found
    app.use(async (_: Request, __: Response, next: NextFunction) => {
        try {
            throw new APIError(404, 'Page Not Found');
        }
        catch(error) {
            next(error);
        }
    });
}
