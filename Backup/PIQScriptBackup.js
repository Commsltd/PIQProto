// Current page tracker
let currentPage = 1;
const itemsPerPage = 10;
let accountsData = [];
let companyData = [];

// Load initial data and setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    loadPaymentPracticesData();
    loadCompanyData(); // Load company data when the page loads
    loadSavedReports(); // Load saved reports when the page loads
    setupEventListeners();
    applySavedTheme();

    // Pagination controls
    const nextPageButton = document.getElementById('next-page');
    const prevPageButton = document.getElementById('prev-page');

    if (nextPageButton) {
        nextPageButton.addEventListener('click', nextPage);
    } else {
        console.error('Element with ID "next-page" not found.');
    }

    if (prevPageButton) {
        prevPageButton.addEventListener('click', prevPage);
    } else {
        console.error('Element with ID "prev-page" not found.');
    }

    console.log('JavaScript setup complete.');
});

function setupEventListeners() {
    // Theme toggle
    document.querySelector('.toggle-theme').addEventListener('click', toggleTheme);

    // Mutation observer for dynamically added elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const addAccountForm = document.getElementById('add-account-form');
                if (addAccountForm && !addAccountForm.hasAttribute('listener')) {
                    addAccountForm.addEventListener('submit', addNewAccount);
                    addAccountForm.setAttribute('listener', true);
                    console.log('Event listener added to dynamically loaded add-account-form');
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('MutationObserver set up to watch for changes in the DOM');

    // Event listeners for form submissions
    const addAccountForm = document.getElementById('add-account-form');
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', addNewAccount);
        console.log('Event listener added to add-account-form');
    } else {
        console.error('Element with ID "add-account-form" not found.');
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchAccounts);
        console.log('Event listener added to searchInput');
    } else {
        console.error('Element with ID "searchInput" not found.');
    }
}

// Load CSV data and initialize analysis
function loadPaymentPracticesData() {
    console.log('Loading payment practices data from CSV...');
    Papa.parse('http://localhost:9090/public/payment-practices.csv', {
        download: true,
        header: true,
        complete: function(results) {
            console.log('CSV loaded and parsed successfully.');
            accountsData = results.data; // Store the data globally
            calculateRiskScores(accountsData); // Calculate risk scores
            console.log('Parsed data:', accountsData);
            displayAccounts(accountsData, currentPage); // Display first page of accounts
            populateSummaryCards(accountsData);
            populateHighRiskAccounts(accountsData);
            populateCriticalAlerts(accountsData);
            initializeCharts(accountsData);
        },
        error: function(error) {
            console.error('Error loading payment practices data:', error);
        }
    });
}

// Function to load company data
function loadCompanyData() {
    console.log('Loading company data from CSV...');
    Papa.parse('http://localhost:9090/public/payment-practices.csv', {
        download: true,
        header: true,
        complete: function(results) {
            console.log('Company CSV loaded and parsed successfully.');
            companyData = results.data; // Store the data globally
            calculateRiskScores(companyData); // Calculate risk scores for company data
            console.log('Parsed company data:', companyData);
        },
        error: function(error) {
            console.error('Error loading company data:', error);
        }
    });
}

// Function to calculate risk scores for all accounts
function calculateRiskScores(data) {
    data.forEach(account => {
        let riskScore = 0;
        riskScore += parseFloat(account['Average time to pay']) || 0;
        riskScore += parseFloat(account['% Invoices not paid within agreed terms']) || 0;
        riskScore += parseFloat(account['% Invoices paid later than 60 days']) || 0;
        account['Risk Score'] = riskScore;
    });
}

// Function to display accounts with pagination
function displayAccounts(data, page = 1) {
    console.log('Displaying accounts:', data);
    const tableBody = document.getElementById('account-table');
    tableBody.innerHTML = '';

    // Calculate the start and end indices for the current page
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    paginatedData.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${account.Company}</td>
            <td>${parseFloat(account['Outstanding Balance']).toFixed(2)}</td>
            <td>${parseFloat(account['Risk Score']).toFixed(2)}</td>
            <td>${account['Last Payment Date']}</td>
            <td>${account['Account Status']}</td>
        `;
        tableBody.appendChild(row);
    });

    // Update pagination controls
    updatePaginationControls(data, page);
}

// Function to update pagination controls
function updatePaginationControls(data, page) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    document.getElementById('prev-page').disabled = page <= 1;
    document.getElementById('next-page').disabled = page >= totalPages;
}

// Function to go to the next page
function nextPage() {
    currentPage++;
    displayAccounts(accountsData, currentPage);
}

// Function to go to the previous page
function prevPage() {
    currentPage--;
    displayAccounts(accountsData, currentPage);
}

// Function to add a new account
function addNewAccount(event) {
    event.preventDefault();
    console.log('Adding new account...');

    // Show loading visual
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.textContent = 'Adding account, please wait...';
    document.body.appendChild(loadingMessage);

    // Simulate a delay for processing (e.g., network request)
    setTimeout(() => {
        const newAccount = {
            Company: document.getElementById('account-name').value,
            'Outstanding Balance': parseFloat(document.getElementById('outstanding-balance').value),
            'Risk Score': parseFloat(document.getElementById('risk-score').value),
            'Last Payment Date': document.getElementById('last-payment-date').value,
            'Account Status': document.getElementById('account-status').value
        };

        console.log('New account details:', newAccount);
        accountsData.push(newAccount);
        displayAccounts(accountsData, currentPage);

        // Update the dashboard
        populateSummaryCards(accountsData);
        populateHighRiskAccounts(accountsData);
        populateCriticalAlerts(accountsData);
        initializeCharts(accountsData);

        // Clear the form
        event.target.reset();
        console.log('Form reset after adding new account');

        // Remove loading visual
        loadingMessage.remove();

        // Show confirmation message
        const confirmationMessage = document.createElement('div');
        confirmationMessage.className = 'confirmation-message';
        confirmationMessage.textContent = 'Account added successfully!';
        document.body.appendChild(confirmationMessage);

        // Remove the confirmation message after a few seconds
        setTimeout(() => {
            confirmationMessage.remove();
        }, 3000);
    }, 2000); // Simulate a 2-second delay for processing
}

// Function to search accounts
function searchAccounts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    console.log('Searching accounts with input:', searchInput);
    const filteredAccounts = accountsData.filter(account =>
        (account.Company && account.Company.toLowerCase().includes(searchInput)) ||
        (account['Account Status'] && account['Account Status'].toLowerCase().includes(searchInput))
    );
    console.log('Filtered accounts:', filteredAccounts);
    displayAccounts(filteredAccounts, 1); // Reset to first page of search results
}

// Function to apply saved theme from localStorage
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    }
    console.log('Theme loaded from local storage. Dark mode:', document.body.classList.contains('dark-mode'));
}

// Function to toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
    console.log('Theme toggled. Dark mode:', document.body.classList.contains('dark-mode'));
}

// Populate the summary cards with data
function populateSummaryCards(data) {
    console.log('Populating summary cards...');
    const totalAccounts = data.length;
    const totalOutstanding = data.reduce((sum, account) => sum + parseFloat(account['Outstanding Balance'] || 0), 0);
    const averageRiskScore = data.reduce((sum, account) => sum + parseFloat(account['Risk Score'] || 0), 0) / totalAccounts;

    document.getElementById('total-accounts').textContent = totalAccounts;
    document.getElementById('total-outstanding').textContent = totalOutstanding.toFixed(2);
    document.getElementById('average-risk-score').textContent = averageRiskScore.toFixed(2);
    document.getElementById('recent-activities').textContent = 'Data loaded'; // Placeholder for recent activities

    console.log('Summary cards populated:', { totalAccounts, totalOutstanding, averageRiskScore });
}

// Populate the top 5 high-risk accounts
function populateHighRiskAccounts(data) {
    console.log('Populating high-risk accounts...');

    // Example risk score calculation logic
    const calculateRiskScore = (account) => {
        let riskScore = 0;
        riskScore += parseFloat(account['Average time to pay']) || 0;
        riskScore += parseFloat(account['% Invoices not paid within agreed terms']) || 0;
        riskScore += parseFloat(account['% Invoices paid later than 60 days']) || 0;
        return riskScore;
    };

    // Add a risk score to each account
    data.forEach(account => {
        account['Risk Score'] = calculateRiskScore(account);
    });

    // Sort accounts by risk score
    const sortedByRisk = data.sort((a, b) => b['Risk Score'] - a['Risk Score']);
    const topHighRiskAccounts = sortedByRisk.slice(0, 5);

    // Display top 5 high-risk accounts
    const list = document.getElementById('high-risk-accounts');
    list.innerHTML = '';

    topHighRiskAccounts.forEach(account => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = `${account.Company}: Risk Score ${account['Risk Score'].toFixed(2)}`;
        list.appendChild(listItem);
    });

    console.log('High-risk accounts populated:', topHighRiskAccounts);
}

// Populate the critical alerts
function populateCriticalAlerts(data) {
    console.log('Populating critical alerts...');
    const criticalAlerts = data
        .filter(account => parseFloat(account['% Invoices not paid within agreed terms']) > 50)
        .sort((a, b) => b['% Invoices not paid within agreed terms'] - a['% Invoices not paid within agreed terms'])
        .slice(0, 10); // Limit to the top 10 critical alerts

    const list = document.getElementById('critical-alerts');
    list.innerHTML = '';
    criticalAlerts.forEach(account => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = `${account['Company']}: ${account['% Invoices not paid within agreed terms']}% invoices not paid within agreed terms`;
        list.appendChild(listItem);
    });

    console.log('Critical alerts list populated:', criticalAlerts);
}

// Initialize charts with data
let paymentsChart, riskChart, paymentTermsChart, averagePaymentTimeChart;

function initializeCharts(data) {
    try {
        console.log('Initializing charts...');

        // Destroy existing charts if they exist
        if (paymentsChart) paymentsChart.destroy();
        if (riskChart) riskChart.destroy();
        if (paymentTermsChart) paymentTermsChart.destroy();
        if (averagePaymentTimeChart) averagePaymentTimeChart.destroy();

        // Payments Over Time chart
        const paymentsChartCtx = document.getElementById('paymentsChart').getContext('2d');
        const paymentsChartData = data.map(account => ({
            x: new Date(account['Filing date']),
            y: parseFloat(account['Payments made in the reporting period'] || 0)
        }));
        paymentsChartData.sort((a, b) => a.x - b.x);

        paymentsChart = new Chart(paymentsChartCtx, {
            type: 'line',
            data: {
                labels: paymentsChartData.map(entry => entry.x.toLocaleDateString()),
                datasets: [{
                    label: 'Payments Over Time',
                    data: paymentsChartData.map(entry => entry.y),
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Payment Amount'
                        }
                    }
                }
            }
        });

        console.log('Payments Over Time chart initialized.');

        // Risk Distribution chart
        const riskChartCtx = document.getElementById('riskChart').getContext('2d');
        const riskScores = data.map(account => parseFloat(account['Average time to pay']) || 0);
        const riskCounts = riskScores.reduce((acc, score) => {
            const range = Math.floor(score);
            acc[range] = (acc[range] || 0) + 1;
            return acc;
        }, {});

        riskChart = new Chart(riskChartCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(riskCounts),
                datasets: [{
                    label: 'Risk Distribution',
                    data: Object.values(riskCounts),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Risk Score'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Accounts'
                        }
                    }
                }
            }
        });

        console.log('Risk Distribution chart initialized.');

        // Payment Terms Analysis chart
        const paymentTermsChartCtx = document.getElementById('paymentTermsChart').getContext('2d');
        const paymentTermsData = data.map(account => ({
            x: new Date(account['Filing date']),
            y: parseFloat(account['Longest standard payment period'] || 0)
        }));
        paymentTermsData.sort((a, b) => a.x - b.x);

        paymentTermsChart = new Chart(paymentTermsChartCtx, {
            type: 'line',
            data: {
                labels: paymentTermsData.map(entry => entry.x.toLocaleDateString()),
                datasets: [{
                    label: 'Longest Standard Payment Period Over Time',
                    data: paymentTermsData.map(entry => entry.y),
                    fill: false,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    }
                }
            }
        });

        console.log('Payment Terms Analysis chart initialized.');

        // Average Payment Time Analysis chart
        const averagePaymentTimeChartCtx = document.getElementById('averagePaymentTimeChart').getContext('2d');
        const averagePaymentTimeData = data.map(account => ({
            x: new Date(account['Filing date']),
            y: parseFloat(account['Average time to pay'] || 0)
        }));
        averagePaymentTimeData.sort((a, b) => a.x - b.x);

        averagePaymentTimeChart = new Chart(averagePaymentTimeChartCtx, {
            type: 'line',
            data: {
                labels: averagePaymentTimeData.map(entry => entry.x.toLocaleDateString()),
                datasets: [{
                    label: 'Average Payment Time Over Time',
                    data: averagePaymentTimeData.map(entry => entry.y),
                    fill: false,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    }
                }
            }
        });

        console.log('Average Payment Time Analysis chart initialized.');

    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Function to update the page title in the top bar
function updatePageTitle(title) {
    document.getElementById('page-title').textContent = title;
}

// Function to handle navigation between sections
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        // Hide all sections and show the selected one
        document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
        document.querySelector(link.getAttribute('href')).style.display = 'block';
        
        // Update the page title
        const sectionTitle = link.textContent.trim(); // Get the link text for the title
        updatePageTitle(sectionTitle);
    });
});

// Example function to log activities
const recentActivitiesList = document.getElementById('recent-activities');
let activities = [];

// Function to log activities
function logActivity(activity) {
    // Add the new activity to the beginning of the list
    activities.unshift(activity);

    // Limit the activities list to 5 items
    if (activities.length > 5) {
        activities.pop();
    }

    // Clear and update the displayed list of activities
    recentActivitiesList.innerHTML = '';
    activities.forEach(act => {
        const activityItem = document.createElement('li');
        activityItem.textContent = act;
        recentActivitiesList.appendChild(activityItem);
    });
}

// Function to validate the form inputs before submission
function validateForm() {
    const dunsNumber = document.getElementById('duns_number').value;
    const productId = document.getElementById('product_id').value;

    if (!dunsNumber || !productId) {
        alert('Please fill in both DUNS Number and Product ID.');
        return false;
    }
    return true; // Proceed with form submission
}

// Function to load saved reports
function loadSavedReports() {
    const savedReports = JSON.parse(localStorage.getItem('savedReports')) || [];
    const reportsList = document.getElementById('saved-reports-list');
    reportsList.innerHTML = '';

    savedReports.forEach(report => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = `Report ID: ${report.id} - Click to view`;
        listItem.onclick = () => viewReport(report.id);
        reportsList.appendChild(listItem);
    });
}

// Function to view a saved report
function viewReport(reportId) {
    const savedReports = JSON.parse(localStorage.getItem('savedReports')) || [];
    const report = savedReports.find(r => r.id === reportId);
    if (report) {
        document.getElementById('reports-list').innerHTML = report.content;
        document.querySelector('.sidebar a[href="#reports"]').click(); // Switch to Reports tab
    } else {
        alert('Report not found.');
    }
}

// Function to generate a detailed report for selected companies
function generateReport() {
    if (selectedCompanies.length === 0) {
        alert('No companies selected for the report.');
        return;
    }

    // Generate the report content
    let reportContent = '';
    selectedCompanies.forEach(company => {
        reportContent += `
            <h3>${company.Company}</h3>
            <p><strong>DUNS:</strong> ${company.DUNS}</p>
            <p><strong>Company Number:</strong> ${company['Company number']}</p>
            <p><strong>Payments made in the reporting period:</strong> ${company['Payments made in the reporting period']}</p>
            <p><strong>Average time to pay:</strong> ${company['Average time to pay']}</p>
            <p><strong>% Invoices paid within 30 days:</strong> ${company['% Invoices paid within 30 days']}</p>
            <p><strong>% Invoices paid later than 60 days:</strong> ${company['% Invoices paid later than 60 days']}</p>
            <p><strong>% Invoices not paid within agreed terms:</strong> ${company['% Invoices not paid within agreed terms']}</p>
            <p><strong>Longest standard payment period:</strong> ${company['Longest standard payment period']}</p>
            <p><strong>Maximum contractual payment period:</strong> ${company['Maximum contractual payment period']}</p>
            <p><strong>Policy covers charges for remaining on supplier list:</strong> ${company['Policy covers charges for remaining on supplier list']}</p>
            <p><strong>Charges have been made for remaining on supplier list:</strong> ${company['Charges have been made for remaining on supplier list']}</p>
            <!-- Add more fields as needed -->
        `;
    });

    // Display the report content in the Reports section
    document.getElementById('reports-list').innerHTML = reportContent;
    document.querySelector('.sidebar a[href="#reports"]').click(); // Switch to Reports tab
}

// Function to download the report as a text file
function downloadReport() {
    const reportContent = document.getElementById('reports-list').innerHTML;
    if (!reportContent) {
        alert('No report content available to download.');
        return;
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Function to save the report for later use
function saveReport() {
    const reportContent = document.getElementById('reports-list').innerHTML;
    if (!reportContent) {
        alert('No report content available to save.');
        return;
    }

    // Save the report to localStorage (or database)
    let savedReports = JSON.parse(localStorage.getItem('savedReports')) || [];
    const reportId = new Date().getTime(); // Use a timestamp as the report ID
    savedReports.push({ id: reportId, content: reportContent });
    localStorage.setItem('savedReports', JSON.stringify(savedReports));

    // Notify the user and update the saved reports list
    alert('Report saved successfully.');
    loadSavedReports(); // Refresh the list of saved reports
}

// Function to search companies based on input in the Risk Analysis section
function searchCompanies() {
    const query = document.getElementById('search-company').value.toLowerCase();
    console.log('Searching companies with query:', query);
    const searchResults = document.getElementById('search-results');

    if (query.length < 3) {
        searchResults.innerHTML = ''; // Clear results if query is too short
        return;
    }

    // Filter the real company data based on query
    const filteredCompanies = companyData.filter(company => 
        company.Company.toLowerCase().includes(query) ||
        (company['Company number'] && company['Company number'].includes(query)) ||
        (company.DUNS && company.DUNS.includes(query)) // assuming DUNS is the DUNS field in the data
    );

    // Display search results
    searchResults.innerHTML = '';
    if (filteredCompanies.length === 0) {
        searchResults.innerHTML = '<li class="list-group-item">No results found</li>';
    } else {
        filteredCompanies.forEach(company => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = `${company.Company} (DUNS: ${company.DUNS}, Number: ${company['Company number']})`;
            listItem.onclick = () => selectCompany(company);
            searchResults.appendChild(listItem);
        });
    }

    console.log('Filtered companies:', filteredCompanies);
}

// Array to store selected companies for generating reports
let selectedCompanies = [];

// Function to handle company selection from search results
function selectCompany(company) {
    // Check if the company is already selected
    if (!selectedCompanies.some(c => c['Company number'] === company['Company number'])) {
        selectedCompanies.push(company);
        console.log('Selected companies:', selectedCompanies);

        // Display the selected companies
        const selectedCompaniesList = document.getElementById('selected-companies');
        const companyDiv = document.createElement('div');
        companyDiv.className = 'selected-company';
        companyDiv.textContent = `${company.Company} (DUNS: ${company.DUNS}, Number: ${company['Company number']})`;
        selectedCompaniesList.appendChild(companyDiv);
    } else {
        alert(`${company.Company} is already selected.`);
    }
}

// Pagination controls
document.getElementById('next-page').addEventListener('click', nextPage);
document.getElementById('prev-page').addEventListener('click', prevPage);

console.log('JavaScript setup complete.');
