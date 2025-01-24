const serverURL = 'http://localhost:3000';

// Load progress from the server on page load
document.addEventListener('DOMContentLoaded', () => {
    fetch(`${serverURL}/progress`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then((progress) => {
            // Update checkboxes based on the saved progress
            Object.keys(progress).forEach((id) => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = progress[id];
                }
            });
        })
        .catch((error) => {
            console.error('Error loading progress:', error);
        });
});

// Save progress to the server when a checkbox is toggled
function saveProgress(id, value) {
    const update = { [id]: value };

    fetch(`${serverURL}/progress`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(update),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (!data.success) {
                console.error('Error updating progress:', data.error);
            }
        })
        .catch((error) => {
            console.error('Error updating progress:', error);
        });
}
