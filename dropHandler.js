var data_to_send = "";

var doc_data = "";

var submit_counter = 0;

function send_data(parameterValue){
  fetch(`/getdata?param=${parameterValue}`, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

var file_label = document.getElementById("upload_text");

function dropHandler(ev) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile();
        console.log(`file[${i}].name = ${file.name}`);
        file_label.innerHTML = "<input type=\"file\" id=\"upload_button\" name=\"files[]\" size=1>" + "File Uploaded: " + file.name;
        const reader = new FileReader();
        reader.onload = function(event) {
          console.log(event.target.result); // Log the content of the file
        };

        if (file.name.endsWith(".pdf")) {
          handlePDF(file);
        } else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")){
          handleDocxOrDoc(file);
        } else {
          reader.readAsText(file); // Read other file types as text
        }
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      console.log(`file[${i}].name = ${file.name}`);
      file_label.innerHTML = "<input type=\"file\" id=\"upload_button\" name=\"files[]\" size=1>" + "File Uploaded: " + file.name;
    });
  }
}

function dragOverHandler(ev) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("upload_button");

    fileInput.addEventListener("change", async (event) => {
        const selectedFile = event.target.files[0];
        file_label.innerHTML = "<input type=\"file\" id=\"upload_button\" name=\"files[]\" size=1>" + "File Uploaded: " + selectedFile.name;

        if (selectedFile) {
            const fileType = selectedFile.type;

            if (fileType === "application/pdf") {
                await handlePDF(selectedFile);
            } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileType === "application/msword") {
                await handleDocxOrDoc(selectedFile);
            } else {
                console.log("Unsupported file type.");
                file_label.innerHTML = "<input type=\"file\" id=\"upload_button\" name=\"files[]\" size=1>" + "Unsupported File Type";
            }
        } else {
            console.log("No file selected.");
        }
    });
});

async function handlePDF(file) {
    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
    const pdfDocument = await loadingTask.promise;

    let pdfText = "";

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        const page = await pdfDocument.getPage(pageNumber);
        const pageText = await page.getTextContent();
        const pagePlainText = pageText.items.map(item => item.str).join(" ");
        pdfText += pagePlainText + "\n";
    }

    console.log("PDF Content:", pdfText);
    data_to_send = pdfText;
}

async function handleDocxOrDoc(file) {
    const reader = new FileReader();

    reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const plainText = result.value.replace(/<[^>]*>/g, " "); // Remove HTML tags
        console.log("DOCX/DOC Content:", plainText);
        data_to_send = plainText;
    };

    reader.readAsArrayBuffer(file);
}

var doc = new jsPDF()

var preview_parent = document.getElementById("preview_parent");

// Client-side JavaScript
const button = document.getElementById('start');
button.addEventListener('click', async () => {

  var preview_parent = document.getElementById("preview_parent");
  var loading2 = document.getElementById("loading2");
  var image = document.getElementById('image');
  var loading = document.getElementById('loading');

  if (submit_counter == 0){
    image.style.height = '0px';
    image.style.width = '0px';

    loading.style.height = '100px';
    loading.style.width = '100px';

    file_label.innerHTML = "Processing your resume";

    submit_counter++;

  } else { 
    preview_parent.style.display = "none";
    loading2.style.display = "block";
  }

    var file_format = document.getElementById("file_format");
    var max_words = document.getElementById("max_words");

  const parameterValue = encodeURIComponent(data_to_send);
  const fileFormatValue = encodeURIComponent(file_format.options[file_format.selectedIndex].text);
  const maxWordsValue = encodeURIComponent(max_words.value);

  const url = `${window.location.origin}:3000/getdata?param=${parameterValue}&param2=${fileFormatValue},${maxWordsValue}`;

  try {
    const response = await fetch(url, {
      method: 'GET'
    });
    const data = await response.text(); // Read the response as plain text
    console.log('Server response:', data);

    doc_data = data;

    var broken_data = doc.splitTextToSize(data, 180);

    var counter = 0;
    var preview = document.getElementById("page");

    preview_parent.style.display = "block";
    loading2.style.display = "none";

    preview_parent.style.display = "block";

    var main = document.getElementById("main")
    main.style.display = "none";

    preview.innerHTML = "";

    if (file_format.options[file_format.selectedIndex].text !== "Markdown"){
      for (let i = 0; i < broken_data.length; i++){
        if (counter <= 42){
          counter++;
          doc.text(broken_data[i] + "\n", 10, 6*counter);
          preview.innerHTML = preview.innerHTML + "<p id=\"preview\" class=\"text\">" + broken_data[i] + "</p>" + "<br>"
          console.log(broken_data[i] + "\n");
        }
        else {
          counter = 0;
          doc.addPage();
          doc.text(broken_data[i] + "\n", 10, 6*counter);
          preview.innerHTML = preview.innerHTML + "<p id=\"preview\" class=\"text\">" + broken_data[i] + "</p>" + "<br>"
          console.log(broken_data[i] + "\n");
        }
      }
    } else {
      const previewElement = document.getElementById('md');
      md.innerHTML = marked.parse(data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
});

re_submit.addEventListener('click', async () => {
  button.click();
  doc = new jsPDF();
});

const download = document.getElementById('download');
download.addEventListener('click', async () => {
  if (file_format.options[file_format.selectedIndex].text !== "Markdown"){
    doc.save('resume.pdf');
    console.log(format.options[format.selectedIndex].text)
  }
  else {
    // Create a Blob with the text content
    const blob = new Blob([String(doc_data)], { type: "text/plain" });

    // Save the Blob as a file with FileSaver.js
    console.log("DOCDATA: " + doc_data);
    saveAs(blob, "resume.md");
  }
  window.location.href = "./downloadfile";
});
