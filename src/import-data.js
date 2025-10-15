document.addEventListener('DOMContentLoaded', () => {
  const upload = document.getElementById('fileUpload');
  const input = document.getElementById('fileInput');
  const csvInput = document.getElementById('csvInput');
  const chooseExcelBtn = document.getElementById('chooseExcelBtn');
  const chooseCsvBtn = document.getElementById('chooseCsvBtn');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const mappingSection = document.getElementById('mappingSection');
  const sheetMapping = document.getElementById('sheetMapping');
  const startImport = document.getElementById('startImport');
  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const importLog = document.getElementById('importLog');

  function log(message, type = 'log') {
    const p = document.createElement('div');
    p.className = `log-entry log-${type}`;
    p.textContent = message;
    importLog.appendChild(p);
    importLog.scrollTop = importLog.scrollHeight;
  }

  function showFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
    fileInfo.style.display = 'block';
  }

  upload.addEventListener('click', () => input.click());
  if (chooseExcelBtn) chooseExcelBtn.addEventListener('click', () => input.click());
  if (chooseCsvBtn) chooseCsvBtn.addEventListener('click', () => csvInput.click());
  upload.addEventListener('dragover', (e) => { e.preventDefault(); upload.classList.add('dragover'); });
  upload.addEventListener('dragleave', () => upload.classList.remove('dragover'));
  upload.addEventListener('drop', (e) => {
    e.preventDefault();
    upload.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  input.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });
  if (csvInput) {
    csvInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });
  }

  function handleFile(file) {
    showFileInfo(file);
    importLog.innerHTML = '';
    mappingSection.style.display = 'block';
    sheetMapping.innerHTML = '';
    startImport.disabled = true;

    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      const item = document.createElement('div');
      item.className = 'sheet-item';
      item.innerHTML = `
        <div class="sheet-name">CSV файл</div>
        <span class="sheet-status status-mapped">готово</span>
      `;
      sheetMapping.appendChild(item);
      startImport.disabled = false;
      startImport.onclick = () => parseCSV(file);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      // Базовый разбор Excel: показываем листы, импорт по первому
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        wb.SheetNames.forEach((sheet) => {
          const item = document.createElement('div');
          item.className = 'sheet-item';
          item.innerHTML = `
            <div class="sheet-name">Лист: ${sheet}</div>
            <span class="sheet-status status-mapped">готово</span>
          `;
          sheetMapping.appendChild(item);
        });
        startImport.disabled = false;
        startImport.onclick = () => parseXLSX(wb);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Поддерживаются только .csv, .xlsx, .xls');
    }
  }

  function setProgress(p, text) {
    progressSection.style.display = 'block';
    progressFill.style.width = `${p}%`;
    progressText.textContent = text;
  }

  // CSV формат пользователя: 4 колонки с заголовком (как в примере)
  function parseCSV(file) {
    setProgress(5, 'Чтение CSV...');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (res) => {
        log(`Строк прочитано: ${res.data.length}`, 'success');
        setProgress(35, 'Преобразование записей...');
        const rows = res.data.map((r) => ({
          subject: r['Субъект'] || r['Subject'] || '',
          point: r['Пункт ФПСР'] || r['Point FPSR'] || '',
          indicator: r['Наименование статистического показателя'] || r['Name of the statistical factor'] || '',
          value: r['Значение статистического показателя (за январь-июль 2025 года)'] || r['Importance of the statistical factor'] || ''
        }));

        // Отправка на backend (при необходимости заведем отдельный маршрут)
        try {
          setProgress(65, 'Отправка данных на сервер...');
          const resp = await fetch('/api/documents/import-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows })
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const result = await resp.json();
          log(`Импортировано: ${result.imported || rows.length}`, 'success');
          setProgress(100, 'Готово');
        } catch (e) {
          log(`Ошибка отправки: ${e.message}`, 'error');
          setProgress(100, 'Готово с ошибками');
        }
      },
      error: (err) => {
        log(`Ошибка разбора CSV: ${err.message}`, 'error');
        setProgress(100, 'Готово с ошибками');
      }
    });
  }

  function parseXLSX(workbook) {
    setProgress(15, 'Чтение Excel...');
    const firstSheet = workbook.SheetNames[0];
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
    log(`Строк на первом листе: ${json.length}`, 'success');
    setProgress(60, 'Отправка данных на сервер...');
    fetch('/api/documents/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: json })
    })
    .then((r) => r.json())
    .then((res) => { setProgress(100, 'Готово'); log('Импорт завершен', 'success'); })
    .catch((e) => { setProgress(100, 'Готово с ошибками'); log(e.message, 'error'); });
  }
});


