import mongoose from "mongoose";
import { middlewares } from "sc-common";

export default (config) => middlewares.database.configureDatabase(mongoose, config);
