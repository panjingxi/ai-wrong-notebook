async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/videos/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords: ['等比数列'] })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        if (data.items && data.items.length > 0) {
            console.log("Success! Found " + data.items.length + " videos.");
            console.log("First video: " + data.items[0].title);
        } else {
            console.log("No videos found or error:", data);
        }
    } catch (e) {
        console.error(e);
    }
}

test();
