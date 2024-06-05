import expres, { Router } from "express";
import AuthRoutes from "./user";
import NotificationRoutes from "./notification";
import AdminRoutes from "./admin";

const routes = expres();

routes.get("/", (_req, res) => {
    res.send("JustBuySell API v1");
});
 
routes.use("/user-api", AuthRoutes);
routes.use("/admin", AdminRoutes);
// routes.use("/v1", UserRoutes);


export default routes;
