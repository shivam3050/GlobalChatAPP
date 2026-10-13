import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url); // this is the url of current file in the system
const __dirname = path.dirname(__filename);


export const handlingFilesDir = path.join(__dirname, 'handlingFilesDir');

export const deleteAllAssociatedFiles = async (username, dir) => {
    // try {

    //     if (dir != "handlingFilesDir") return false



    //     const client = activeClients.get(username)
    //     const fileKeyword = client.Username

    //     fs.readdir(dir, (err, files) => {
    //         if (err) throw err;

    //         files.forEach(file => {
    //             if (file.includes(fileKeyword)) {
    //                 fs.unlink(path.join(dir, file), err => {
    //                     if (err && err.code !== 'ENOENT') throw err;
    //                 });
    //             }
    //         });
    //     });



    //     return true
    // } catch (error) {
    //     console.log(error)
    //     return false
    // }
}
export const deleteOneFile = (path) => {
    // try {
    //     const ans = fs.unlink(path);
    //     return true
    // } catch (err) {
    //     console.error(err);
    //     return false
    // }
}

export const filesGarbageCollectorFunction = async (dir) => {

  const filePath = path.join(handlingFilesDir, "hi.txt");

// File create karke usme data likhna
fs.writeFile(filePath,"Yeh file ke andar ka content hai",(err) => {
    if (err) {
        console.error("File create karne mein error aayi:", err);
    } else {
        console.log("File successfully create ho gayi!");
    }
})
    try {
        const files = await fs.promises.readdir(dir); // returns array of file names
        const mins = 20 * 60000;

        for (const file of files) {
            const fullPath = path.join(dir, file);
            try {
                const stats = await fs.promises.stat(fullPath);

                if (stats.isFile() && (Date.now() - stats.birthtime.getTime() > mins)) { // greater then 20 minutes
                    await fs.promises.unlink(fullPath); // delete old file
                    console.log('Deleted:', file);
                }
            } catch {
                // this means its not a file its a dir so skip it , although this case is never going to happend because i have not kept any dir there
            }
        }
    } catch {
        return
    }

};