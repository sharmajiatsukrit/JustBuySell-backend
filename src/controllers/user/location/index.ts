import { Request, Response } from "express";
import ServerMessages, { ServerMessagesEnum } from "../../../config/messages";
import { HttpCodeEnum } from "../../../enums/server";
import { serverResponse, serverErrorHandler, constructResponseMsg } from "../../../utils";
import { Location } from "../../../models";

export default class BannerController {
    public locale: string = "en";
    private appURL: string = process.env.APP_URL || "";

    constructor() { }

    public async updateLocation(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { lat, log, address1, address2, pincode, dist, city } = req.body;
            const { user_id: userid } = req.customer;
    
            // Check if location already exists for the user
            let existingLocation = await Location.findOne({ created_by: userid });
    
            if (existingLocation) {
                existingLocation.lat = lat;
                existingLocation.log = log;
                existingLocation.address1 = address1;
                existingLocation.address2 = address2;
                existingLocation.pincode = pincode;
                existingLocation.dist = dist;
                existingLocation.city = city;
    
                await existingLocation.save();

                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "location-update"), {});
            } else {
                const addlocation = await Location.create({ lat, log, address1, address2, pincode, dist, city, created_by: userid });
                return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "location-add"), {});
            }
    
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }
                        

    public async displayLocation(req: Request, res: Response): Promise<any> {
        try {
            // Set locale
            const { locale } = req.query;
            this.locale = (locale as string) || "en";
    
            const { user_id: userid } = req.user;
    
            const existingLocation = await Location.find({ created_by: userid });
    
            const locationDetails = {
                lat: existingLocation[0].lat,
                log: existingLocation[0].log,
                address1: existingLocation[0].address1,
                address2: existingLocation[0].address2,
                pincode: existingLocation[0].pincode,
                dist: existingLocation[0].dist,
                city: existingLocation[0].city
            };
    
            return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "location-found"), locationDetails);
        } catch (err: any) {
            return serverErrorHandler(err, res, err.message);
        }
    }
    

    // public async deleteLocation(req: Request, res: Response): Promise<any> {
    //     try {
    //         // Set locale
    //         const { locale } = req.query;
    //         this.locale = (locale as string) || "en";
    
    //         const { user_id: userid } = req.user;
    
    //         // Find location for the user
    //         const existingLocation = await Location.find({ created_by: userid });
    
    //         if (!existingLocation) {
    //             // If no location found, return appropriate response
    //             return serverResponse(res, HttpCodeEnum.BADREQUEST, constructResponseMsg(this.locale, "location-not-found"), {});
    //         }
    
    //         // Delete the location
    //         await existingLocation[0].remove();
    
    //         // Return success response
    //         return serverResponse(res, HttpCodeEnum.OK, constructResponseMsg(this.locale, "location-deleted"), {});
    //     } catch (err: any) {
    //         return serverErrorHandler(err, res, err.message);
    //     }
    // }
    
    

}
