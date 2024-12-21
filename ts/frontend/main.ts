// Get references to DOM elements
const dataSourceSelect = document.getElementById('data-source') as HTMLSelectElement;
const downloadButton = document.getElementById('download-data') as HTMLButtonElement;
const randomizeButton = document.getElementById('randomize-data') as HTMLButtonElement;
const numRandomizeInput = document.getElementById('num-randomize') as HTMLInputElement;
const loadingMessage = document.getElementById('loading-message') as HTMLElement;
const downloadRandomizedButton = document.getElementById('download-randomized-file') as HTMLButtonElement;

// Reset default state on page load
window.addEventListener('load', () => {
    dataSourceSelect.value = '';
    downloadButton.disabled = true;
    randomizeButton.disabled = true;
    numRandomizeInput.disabled = true;
    downloadRandomizedButton.disabled = true;
});

// Enable buttons when a valid data source is selected
dataSourceSelect.addEventListener('change', async () => {
    const selectedSource = dataSourceSelect.value;
    downloadButton.disabled = selectedSource === '';

    if (selectedSource) {
        try {
            // Check if the source file is available
            const response = await fetch(`http://localhost:3000/check-file?source=${selectedSource}`);
            const data: { available: boolean } = await response.json();
            randomizeButton.disabled = !data.available;
            numRandomizeInput.disabled = !data.available;
            downloadRandomizedButton.disabled = !data.available;
        } catch (error) {
            console.error('Error checking the file:', error);
            randomizeButton.disabled = true;
            numRandomizeInput.disabled = true;
            downloadRandomizedButton.disabled = true;
        }
    } else {
        randomizeButton.disabled = true;
        numRandomizeInput.disabled = true;
        downloadRandomizedButton.disabled = true;
    }
});

// Handle download button click
downloadButton.addEventListener('click', async () => {
    const source = dataSourceSelect.value;

    // Disable buttons during the download process
    downloadButton.disabled = true;
    randomizeButton.disabled = true;
    dataSourceSelect.disabled = true;
    loadingMessage.style.display = 'block';
    downloadRandomizedButton.disabled = true;

    try {
        // Request to download and extract the data
        const response = await fetch(`http://localhost:3000/download-extract?source=${source}`);
        if (!response.ok) {
            throw new Error('Download failed');
        }

        const data = await response.json();
        alert(data.message);

        // Check the file status again
        const checkResponse = await fetch(`http://localhost:3000/check-file?source=${source}`);
        const checkData: { available: boolean } = await checkResponse.json();
        randomizeButton.disabled = !checkData.available;
        numRandomizeInput.disabled = !checkData.available;
        downloadRandomizedButton.disabled = !checkData.available;
    } catch (error) {
        console.error('Error:', error);
        alert('Error during download. Please try again.');
    } finally {
        // Re-enable buttons
        downloadButton.disabled = false;
        dataSourceSelect.disabled = false;
        loadingMessage.style.display = 'none';
    }
});

// Handle randomize button click
randomizeButton.addEventListener('click', async () => {
    const selectedSource = dataSourceSelect.value;
    const numValues = numRandomizeInput.value;

    // Disable buttons during the randomization process
    randomizeButton.disabled = true;
    downloadButton.disabled = true;
    loadingMessage.style.display = 'block';
    downloadRandomizedButton.disabled = true;

    try {
        // Send request to randomize data
        const response = await fetch(`http://localhost:3000/randomize-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: selectedSource,
                numValues: parseInt(numValues),
            }),
        });

        if (!response.ok) {
            throw new Error('Randomization failed');
        }

        const data = await response.json();
        alert('Data randomized successfully!');

        // Display the JSON data in the div
        const jsonOutput = document.getElementById('json-output') as HTMLElement;
        jsonOutput.textContent = JSON.stringify(data, null, 2);

        // Show the div containing the JSON data and enable the randomized file download button
        document.getElementById('csv_randomized')!.style.display = 'block';
        downloadRandomizedButton.style.display = 'block';
        downloadRandomizedButton.disabled = false;

        // Add event to download the randomized file
        downloadRandomizedButton.addEventListener('click', () => {
            window.location.href = `http://localhost:3000/download/randomized-${selectedSource}.json`;
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error during data randomization. Please try again.');
    } finally {
        // Re-enable buttons
        randomizeButton.disabled = false;
        downloadButton.disabled = false;
        loadingMessage.style.display = 'none';
    }
});