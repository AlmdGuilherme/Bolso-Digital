import { App } from "./app.js";
import 'dotenv/config'

const port  = Number(process.env.PORT) || 3000
const app = new App();

app.listen(port);
