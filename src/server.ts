import dotenv from 'dotenv';
dotenv.config(); 
import express, { Application } from "express";
import App from "./app";

const app = new App();

app.startServer();
