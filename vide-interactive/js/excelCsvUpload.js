// excelCsvUpload.js
function addExcelCsvUpload(editor) {
  editor.Panels.addButton('options', {
    id: 'upload-excel-csv',
    className: 'fa fa-file-upload',
    command: 'open-excel-csv-upload',
    attributes: {
      title: 'Upload Excel or CSV',
    },
  });

  editor.Commands.add('open-excel-csv-upload', {
    run(editor) {
      const modal = editor.Modal;
      const container = document.createElement('div');

      container.innerHTML = `
        <div style="padding: 10px;">
          <h4>Upload Excel / CSV File</h4>
          <input type="file" id="excelCsvInput" accept=".csv, .xlsx" />
          <br><br>
          <button id="uploadExcelCsvBtn" style="padding: 5px 10px;">Add</button>
        </div>
      `;

      modal.setTitle('Upload Data File');
      modal.setContent(container);
      modal.open();

      container.querySelector('#uploadExcelCsvBtn').onclick = async () => {
        const input = container.querySelector('#excelCsvInput');
        const file = input.files[0];

        if (!file) {
          alert('Please select a file!');
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('http://192.168.0.177:8080/apis/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const data = await response.text();
          alert('Upload successful!');
          console.log(data);
          modal.close();
        } catch (error) {
          console.error('Error:', error);
          alert('Upload failed. See console for details.');
        }



      };
    },
  });
}

// Expose to global scope
window.addExcelCsvUpload = addExcelCsvUpload;
