
import { Readable } from 'stream';


export async function createDriveFolder(googleDrive, folderName, parentFolderId = null) {
  try {
    // 1. First validate the googleDrive client
    if (!googleDrive || !googleDrive.files) {
      throw new Error('Invalid Google Drive client');
    }

    // 2. Sanitize folder name for query
    const sanitizedName = folderName.replace(/'/g, "\\'");
    let query = `mimeType='application/vnd.google-apps.folder' and name='${sanitizedName}' and trashed=false`;
    
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    // 3. Make API call with proper error handling
    const res = await googleDrive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
      pageSize: 10
    }).catch(err => {
      console.error('Drive API list error:', err.response?.data || err.message);
      throw err;
    });

    // 4. Validate response structure
    if (!res?.data?.files) {
      throw new Error('Invalid response structure from Drive API');
    }

    // 5. Check for existing folder
    if (res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // 6. Create folder metadata
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentFolderId && { parents: [parentFolderId] })
    };

    // 7. Create folder with error handling
    const createRes = await googleDrive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }).catch(err => {
      console.error('Drive API create error:', err.response?.data || err.message);
      throw err;
    });

    console.log(`Created folder ID: ${createRes.data.id}`);
    return createRes.data.id;

  } catch (error) {
    console.error('Failed to create folder:', error.message);
    
    // Special handling for permission issues
    if (error.code === 403 && parentFolderId) {
      console.log('Retrying in root directory...');
      return await createDriveFolder(googleDrive, folderName);
    }
    
    return null;
  }
}






export async function uploadFileToFolder(drive, filename, folderId, mediaBufferReference) {
    try {
        const fileMetadata = {
            name: filename,
            parents: [folderId]
        };

        const media = {
            body: Readable.from(mediaBufferReference)
        };




        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name'
        });

        console.log(`Uploaded file: ${response.data.name} (ID: ${response.data.id})`);
        return response.data.id;
    } catch (error) {
        console.error('Error uploading file:', error);
        return null;
    }
}


export async function downloadFileBufferWithMeta(drive, fileId) {
    try {
        // Get metadata
        const metaRes = await drive.files.get({ fileId, fields: 'name, size' });
        const { name, size } = metaRes.data;

        // Get file content
        const res = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const chunks = [];
        await new Promise((resolve, reject) => {
            res.data.on('data', chunk => chunks.push(chunk));
            res.data.on('end', () => resolve());
            res.data.on('error', err => reject(err));
        });
        console.log("download output = ",{
            
            name,
            size: parseInt(size, 10)
        })

        return {
            buffer: Buffer.concat(chunks),
            name,
            size: parseInt(size, 10)
        };
    } catch (error) {
        if (error.code === 404) {
            console.error('Error: File not found on Google Drive.');
        } else {
            console.error('Error downloading file:', error);
        }
        return null;
    }
}
