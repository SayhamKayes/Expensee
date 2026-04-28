// src/lib/googleDrive.ts

const FILE_NAME = "Expensee_Backup.json";

export const syncToGoogleDrive = async (accessToken: string, appData: any) => {
  try {
    // 1. Search to see if a backup file already exists
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();

    let fileId;

    if (searchData.files && searchData.files.length > 0) {
      // File exists, grab its ID
      fileId = searchData.files[0].id;
    } else {
      // File doesn't exist, create the empty file metadata first
      const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: FILE_NAME })
      });
      const createData = await createRes.json();
      fileId = createData.id;
    }

    // 2. Upload the actual Expense data into that file
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(appData)
    });

    return true;
  } catch (error) {
    console.error("Drive Sync Error:", error);
    throw error;
  }
};

export const downloadFromGoogleDrive = async (accessToken: string) => {
  try {
    // 1. Find the backup file
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      const fileId = searchData.files[0].id;
      
      // 2. Download the data inside it
      const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      return await fileRes.json();
    }
    
    return null; // No backup found
  } catch (error) {
    console.error("Drive Download Error:", error);
    throw error;
  }
};