chrome.alarms.onAlarm.addListener(function (alarm) {
    // Handle the alarm action (e.g., show notification)
    // Implement your alarm action here
    console.log(`${getCurrentTimeInHumanFormat()} Alarm triggered for prayer time:`, alarm.name);

    showAlarmNotification(alarm);

    // play hamd.mp3
    playAudio();
});

// Optional: Initialize the extension with default values if needed
chrome.runtime.onInstalled.addListener(function () {
    const defaultPrayerTimes = {
        fajr: '05:40',
        dhuhr: '13:30',
        asr: '16:30',
        maghrib: '17:45',
        isha: '19:30'
    };

    chrome.storage.local.set({ 'prayerTimes': defaultPrayerTimes });
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    requestNotificationPermission();

    // if (reason !== 'install') {
    //     console.log('This is not a fresh install.', { reason });
    //     return;
    // }
});

function playAudio() {
    if (!self.Audio) {
        console.log('Does not support audio.');
        return;
    }

    const audio = new Audio('/hamd.mp3');
    audio.play();
}

// background.js

// Function to request notification permissions
function requestNotificationPermission() {
    chrome.permissions.request({
        permissions: ['notifications'],
    }, (granted) => {
        if (granted) {
            console.log('Notification permission granted.');
        } else {
            console.log('Notification permission denied.');
        }
    });
}

// Listen for a user gesture, for example, a button click in the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'requestNotificationPermission') {
        // Request notification permissions when triggered by a user gesture
        return requestNotificationPermission();
    }

    if (request.action === 'NotificationPermissionState') {
        // Check if the extension already has notification permissions
        chrome.permissions.contains({ permissions: ['notifications'] }, (result) => {
            if (!result) {
                sendResponse({ hasNotificationPermission: false });
            } else {
                sendResponse({ hasNotificationPermission: true });
            }
        });
        
        return true;
    }
});

// Check if the extension already has notification permissions
chrome.permissions.contains({ permissions: ['notifications'] }, (result) => {
    if (!result) {
        console.log('Notification permissions not granted yet.');
    } else {
        console.log('Notification permissions already granted.');
    }
});

function requestNotificationPermission() {
    if ('Notification' in self) {
        Notification.requestPermission &&
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                } else {
                    alert('Notification permission is required for the full functionality of this extension.');
                    return requestNotificationPermission();
                }
            });
    } else {
        console.log('Browser does not support notifications.');
    }
}

function getCurrentTimeInHumanFormat() {
    const now = new Date();

    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    return `${date} - ${hours}:${minutes}:${seconds}`;
}

function showAlarmNotification(alarm) {
    // const notification = self.registration.showNotification(`It's time for ${alarm.name} prayer!`, {
    //     body: `It's time for ${alarm.name} prayer!`,
    //     // icon: 'assets/icon64x64.png',
    //     requireInteraction: true,
    //     urgency: 'critical',
    // });

    chrome.notifications.create(`ext-salat-alarm-${alarm.name}`, {
        type: 'basic',
        iconUrl: '/icons/icon64x64.png',
        title: `It's time for ${alarm.name} prayer!`,
        message: 'Salat Alarm',
        contextMessage: 'Salat Alarm',
        priority: 2,
        isClickable: true,
        eventTime: alarm.scheduledTime,
    });

    // notification.onclick = () => {
    //     notification.close();
    // }
}
