if (!process.env.DB_URI || !process.env.DB_NAME) {
    console.log("Env var db is undefined");
    process.exit(1);
}

import mongoose from "mongoose";

// print mongoose logs in dev/uat env
// if (process.env.ENV !== 'production') {
//     mongoose.set('debug', true);
// }

const dbConnect = async () => {
    try {
        await mongoose.connect(`${process.env.DB_URI}`, {
            dbName: process.env.DB_NAME,
            maxPoolSize: 5
        });
    } catch (err: any) {
        console.error(err.message);
        process.exit(1);
    }
};

export default dbConnect;
