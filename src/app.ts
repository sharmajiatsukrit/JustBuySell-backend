import cors from "cors";
import express, { Application, NextFunction, Request, Response, RequestHandler } from "express";
import url from "url";
import { HttpCodeEnum } from "./enums/server";
import { DataBase } from "./models";
import AppRoutes from "./routes";
import { serverResponse } from "./utils";
import Logger from "./utils/logger";
import fs from 'fs';
let http: any;
let sslOptions = {};
if (process.env.NODE_ENV === "production") {
    http = require("https");
    sslOptions = {
                key: fs.readFileSync("/etc/letsencrypt/live/api.justbuysell.com/privkey.pem"),
                cert: fs.readFileSync("/etc/letsencrypt/live/api.justbuysell.com/cert.pem"),
            };
} else { 
    http = require("http");
}


declare global {
    namespace Express {
        interface Request {
            user: {
                user_id: number;
                email: string;
                superadmin: boolean;
            };
            context: { params: any };
        }
    }
}

declare global {
    namespace Express {
        interface Request {
            customer: {
                user_id: number;
                phone: string;
                superadmin: boolean;
            };
            context: { params: any };
        }
    }
}

export default class App {
    public app: express.Application;
    
    constructor() {
        // express app
        this.app = express();

        // Cors Config
        this.app.use(cors());
       
        // Load middleware
        this.loadMiddleWare();
        this.routeManager();
        this.handleUndefinedRoute();
    }

    startServer(): void {
        
        const port: number = Number(process.env.PORT) || 4001; // Port
        DataBase()
        .then(() => {
            console.log("Database connected");
            let server = http.Server(sslOptions, this.app);
            server.listen(port, () => {
                console.log("Server started @ port ", port);
            });
        })
        .catch((err) => console.log("Database connection failed", err));
    }

    loadMiddleWare(): void {
        // Body parser
        this.app.use(express.json({limit: "20mb"}) as RequestHandler);

        this.app.use(express.urlencoded({ extended: true }) as RequestHandler);

        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const parts = url.parse(req.url, true);
            req.context = { params: { ...parts.query, ...req.body } };

            Logger.info("[" + req.method + "] " + req.url
                + ", params: " + JSON.stringify(req.context.params)
                + ", token: " + req.headers.authorization);
            next();
        });

        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const startHrTime = process.hrtime();
            res.on("finish", () => {
                const elapsedHrTime = process.hrtime(startHrTime);
                const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
                console.log("[%s] %s responseTime: %fms", req.method, req.url, elapsedTimeInMs);
            });
            next();
        });
    }

    routeManager(): void {
        this.app.use("/api", AppRoutes);
    }

    handleUndefinedRoute(): Application {
        return this.app.use((req: Request, res: Response) => {
            return serverResponse(res, HttpCodeEnum.NOTFOUND, "API NOT FOUND", []);
        });
    }

}
