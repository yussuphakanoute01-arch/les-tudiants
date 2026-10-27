document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 0. SYSTÈME DE NOTIFICATION TOAST
  // ==========================================
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}" style="color: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // ==========================================
  // 1. GESTION DU MODE CLAIR / SOMBRE
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      if (statsChart) {
        updateChartColors();
      }
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'fa-solid fa-moon';
        themeToggleBtn.title = 'Passer en mode clair';
      } else {
        icon.className = 'fa-solid fa-sun';
        themeToggleBtn.title = 'Passer en mode sombre';
      }
    }
  }

  // ==========================================
  // 2. DONNÉES & ÉTAT (Mise à jour forcée des 4 nouveaux noms)
  // ==========================================
  const defaultStudents = [
    { nom: 'Youssoupha Kanoute', email: 'youssoupha.kanoute@unchk.edu.sn', classe: 'Master 1', note: 20.0 },
    { nom: 'Ndeye Merry Diop', email: 'ndeye.merry.diop@unchk.edu.sn', classe: 'L2 Informatique', note: 14.5 },
    { nom: 'Ousmane Djiboune', email: 'ousmane.djiboune@unchk.edu.sn', classe: 'Master 1', note: 16.0 },
    { nom: 'Mouhamed Mbaye', email: 'mouhamed.mbaye@unchk.edu.sn', classe: 'Master 2', note: 16.0 },
    { nom: 'Awa Ndiaye', email: 'awa.ndiaye@example.com', classe: 'L1 Informatique', note: 12.0 },
    { nom: 'Mbene Diop', email: 'mbene.diop@example.com', classe: 'L3 Informatique', note: 12.0 },
    { nom: 'Gabriel Saint', email: 'saint.gabriel@example.com', classe: 'L1 Informatique', note: 7.5 },
    { nom: 'Cheikh Fall', email: 'cheikh.fall@example.com', classe: 'L1 Informatique', note: 8.0 },
    { nom: 'Fatou Sow', email: 'fatou.sow@example.com', classe: 'L2 Informatique', note: 17.5 }
  ];

  let storedStudents = JSON.parse(localStorage.getItem('unchk_students'));
  if (!storedStudents || !storedStudents.some(s => s.nom === 'Youssoupha Kanoute')) {
    localStorage.setItem('unchk_students', JSON.stringify(defaultStudents));
    storedStudents = defaultStudents;
  }

  let students = storedStudents;
  let currentPage = 1;
  const itemsPerPage = 5;

  const studentIndexInput = document.getElementById('student-index');
  let studentToDelete = null;

  const studentForm = document.getElementById('student-form');
  const nomInput = document.getElementById('nom');
  const emailInput = document.getElementById('email');
  const classeInput = document.getElementById('classe');
  const noteInput = document.getElementById('note');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const errorMessage = document.getElementById('error-message');

  const searchInput = document.getElementById('search-input');
  const filterClasse = document.getElementById('filter-classe');
  const sortOption = document.getElementById('sort-option');
  const studentsTbody = document.getElementById('students-tbody');
  const paginationControls = document.getElementById('pagination-controls');

  const totalStudentsEl = document.getElementById('total-students');
  const generalAverageEl = document.getElementById('general-average');
  const totalAdmisEl = document.getElementById('total-admis');
  const bestStudentEl = document.getElementById('best-student') || createBestStudentElement();

  function createBestStudentElement() {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return null;
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = `<span class="stat-label">Meilleur(e) Étudiant(e)</span><span class="stat-value" id="best-student">-</span>`;
    statsGrid.appendChild(div);
    return document.getElementById('best-student');
  }

  const confirmModal = document.getElementById('confirm-modal');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');

  let statsChart = null;

  function saveAndRender() {
    localStorage.setItem('unchk_students', JSON.stringify(students));
    renderApp();
  }

  function renderApp() {
    let filtered = students.filter(s => {
      const matchesSearch = s.nom.toLowerCase().includes(searchInput.value.toLowerCase()) || 
                            s.email.toLowerCase().includes(searchInput.value.toLowerCase());
      const matchesClasse = filterClasse.value === '' || s.classe === filterClasse.value;
      return matchesSearch && matchesClasse;
    });

    if (sortOption.value === 'nomAsc') {
      filtered.sort((a, b) => a.nom.localeCompare(b.nom));
    } else if (sortOption.value === 'noteDesc') {
      filtered.sort((a, b) => b.note - a.note);
    } else if (sortOption.value === 'noteAsc') {
      filtered.sort((a, b) => a.note - b.note);
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStudents = filtered.slice(startIndex, endIndex);

    studentsTbody.innerHTML = '';

    if (filtered.length === 0) {
      studentsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Aucun étudiant trouvé</td></tr>`;
    } else {
      paginatedStudents.forEach((student) => {
        const originalIndex = students.indexOf(student);
        const isAdmis = student.note >= 10;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${student.nom}</strong></td>
          <td>${student.email}</td>
          <td>${student.classe}</td>
          <td>${student.note.toFixed(2)}/20</td>
          <td><span class="badge ${isAdmis ? 'admis' : 'echec'}">${isAdmis ? 'Admis' : 'Échec'}</span></td>
          <td>
            <button class="btn-action-edit" onclick="editStudent(${originalIndex})">Modifier</button>
            <button class="btn-action-delete" onclick="openDeleteModal(${originalIndex})">Supprimer</button>
          </td>
        `;
        studentsTbody.appendChild(tr);
      });
    }

    renderPaginationControls(totalPages);
    updateStatistics();
    updateChart();
  }

  // ==========================================
  // 3. PAGINATION
  // ==========================================
  function renderPaginationControls(totalPages) {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    const isFirstPage = (currentPage === 1);
    prevBtn.className = `page-btn ${isFirstPage ? 'disabled-btn' : ''}`;
    prevBtn.textContent = '« Précédent';
    prevBtn.disabled = isFirstPage;
    
    if (!isFirstPage) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderApp();
        }
      });
    }
    paginationControls.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderApp();
      });
      paginationControls.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    const isLastPage = (currentPage === totalPages);
    nextBtn.className = `page-btn ${isLastPage ? 'disabled-btn' : ''}`;
    nextBtn.textContent = 'Suivant »';
    nextBtn.disabled = isLastPage;
    
    if (!isLastPage) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderApp();
        }
      });
    }
    paginationControls.appendChild(nextBtn);
  }

  // ==========================================
  // 4. STATISTIQUES & MEILLEUR ÉTUDIANT
  // ==========================================
  function updateStatistics() {
    totalStudentsEl.textContent = students.length;
    const totalAdmis = students.filter(s => s.note >= 10).length;
    totalAdmisEl.textContent = totalAdmis;

    if (students.length > 0) {
      const sum = students.reduce((acc, s) => acc + s.note, 0);
      const avg = sum / students.length;
      generalAverageEl.textContent = avg.toFixed(2) + '/20';

      let best = students.reduce((max, s) => s.note > max.note ? s : max, students[0]);
      if (bestStudentEl) {
        bestStudentEl.textContent = `${best.nom} (${best.note.toFixed(2)}/20)`;
      }
    } else {
      generalAverageEl.textContent = '0,00/20';
      if (bestStudentEl) bestStudentEl.textContent = '-';
    }
  }

  // ==========================================
  // 5. GESTION FORMULAIRE & EMAIL UNIQUE
  // ==========================================
  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = nomInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const classe = classeInput.value.trim();
    const note = parseFloat(noteInput.value);

    if (!nom || !email || !classe || isNaN(note)) {
      errorMessage.textContent = "Veuillez remplir tous les champs correctement.";
      return;
    }

    const currentIndex = studentIndexInput.value === "" ? null : parseInt(studentIndexInput.value);
    const emailExists = students.some((s, idx) => s.email.toLowerCase() === email && idx !== currentIndex);

    if (emailExists) {
      errorMessage.textContent = "Cet e-mail est déjà utilisé par un autre étudiant.";
      showToast("Cet e-mail existe déjà !", "error");
      return;
    }

    errorMessage.textContent = "";

    if (currentIndex === null) {
      students.push({ nom, email, classe, note });
      currentPage = Math.ceil(students.length / itemsPerPage);
      showToast("Étudiant ajouté avec succès !");
    } else {
      students[currentIndex] = { nom, email, classe, note };
      resetForm();
      showToast("Informations mises à jour !");
    }

    studentForm.reset();
    saveAndRender();
  });

  window.editStudent = function(index) {
    const s = students[index];
    nomInput.value = s.nom;
    emailInput.value = s.email;
    classeInput.value = s.classe;
    noteInput.value = s.note;
    studentIndexInput.value = index;
    submitBtn.textContent = "Mettre à jour";
    submitBtn.className = "btn btn-blue";
    cancelBtn.style.display = "inline-block";
    window.scrollTo({ top: studentForm.offsetTop - 100, behavior: 'smooth' });
  };

  cancelBtn.addEventListener('click', () => {
    resetForm();
    studentForm.reset();
  });

  function resetForm() {
    studentIndexInput.value = "";
    submitBtn.textContent = "Ajouter l'étudiant";
    cancelBtn.style.display = "none";
    errorMessage.textContent = "";
  }

  window.openDeleteModal = function(index) {
    studentToDelete = index;
    confirmModal.style.display = 'flex';
  };

  confirmYes.addEventListener('click', () => {
    if (studentToDelete !== null) {
      students.splice(studentToDelete, 1);
      studentToDelete = null;
      confirmModal.style.display = 'none';
      saveAndRender();
      showToast("Étudiant supprimé.", "error");
    }
  });

  confirmNo.addEventListener('click', () => {
    studentToDelete = null;
    confirmModal.style.display = 'none';
  });

  searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderApp();
  });

  filterClasse.addEventListener('change', () => {
    currentPage = 1;
    renderApp();
  });

  sortOption.addEventListener('change', () => {
    currentPage = 1;
    renderApp();
  });

  // ==========================================
  // 6. EXPORT / IMPORT CSV
  // ==========================================
  const exportCsvBtn = document.getElementById('export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (students.length === 0) {
        showToast("Aucun étudiant à exporter.", "error");
        return;
      }
      let csvContent = "Nom complet,E-mail,Classe,Note\n";
      students.forEach(s => {
        csvContent += `"${s.nom}","${s.email}","${s.classe}",${s.note}\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'etudiants_unchk.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Exportation CSV réussie !");
    });
  }

  const importCsvInput = document.getElementById('import-csv');
  if (importCsvInput) {
    importCsvInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          parseCSVAndAddStudents(event.target.result);
        } catch (error) {
          showToast("Erreur lors de la lecture du fichier CSV.", "error");
        }
      };
      reader.readAsText(file);
      this.value = '';
    });
  }

  function parseCSVAndAddStudents(csvText) {
    const lines = csvText.split(/\r\n|\n/);
    let importedCount = 0;
    let duplicatesCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (i === 0 && (line.toLowerCase().includes('nom') || line.toLowerCase().includes('email'))) {
        continue;
      }
      const cols = line.split(/[,;\t]/).map(col => col.replace(/^["']|["']$/g, '').trim());
      if (cols.length >= 4) {
        const nom = cols[0];
        const email = cols[1].toLowerCase();
        const classe = cols[2];
        const note = parseFloat(cols[3].replace(',', '.'));

        if (nom && email && classe && !isNaN(note) && note >= 0 && note <= 20) {
          const emailExists = students.some(s => s.email.toLowerCase() === email);
          if (!emailExists) {
            students.push({ nom, email, classe, note });
            importedCount++;
          } else {
            duplicatesCount++;
          }
        }
      }
    }

    if (importedCount > 0) {
      saveAndRender();
      showToast(`${importedCount} étudiant(s) importé(s) avec succès !`);
    } else {
      showToast("Aucun nouvel étudiant valide importé.", "error");
    }
  }

  // ==========================================
  // 7. GRAPHIQUE CHART.JS
  // ==========================================
  function initChart() {
    const ctx = document.getElementById('statsChart').getContext('2d');
    const admisCount = students.filter(s => s.note >= 10).length;
    const echecCount = students.length - admisCount;
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();

    statsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Admis (>= 10)', 'Échec (< 10)'],
        datasets: [{
          data: [admisCount, echecCount],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: { family: 'Inter', weight: 500 }
            }
          }
        }
      }
    });
  }

  function updateChart() {
    if (!statsChart) {
      initChart();
      return;
    }
    const admisCount = students.filter(s => s.note >= 10).length;
    const echecCount = students.length - admisCount;
    statsChart.data.datasets[0].data = [admisCount, echecCount];
    statsChart.update();
  }

  function updateChartColors() {
    if (!statsChart) return;
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    statsChart.options.plugins.legend.labels.color = textColor;
    statsChart.update();
  }

  renderApp();
});