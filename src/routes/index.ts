import expres, { Router } from "express";
import AuthRoutes from "./auth";
import NotificationRoutes from "./notification";
import AdminRoutes from "./admin";

const routes = expres();

routes.get("/", (_req, res) => {
    res.send("JustBuySell API v1");
});
 
routes.use("/auth", AuthRoutes);
routes.use("/admin", AdminRoutes);
// routes.use("/v1", UserRoutes);
// routes.use("/subscriber", SubscriberRoutes);
// routes.use("/notification", NotificationRoutes);
// routes.use("/payment", PaymentRoutes);
// routes.use("/pubnub", PubnubRoutes);


export default routes;
