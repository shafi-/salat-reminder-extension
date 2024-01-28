/**
 * Represents a time string in the hh:mm format.
 * @typedef {string} TimeString
 * @pattern {string} ^[0-2]?[0-9]:[0-5][0-9]$
 */

/**
 * @typedef {{ fajr: TimeString, dhuhr: TimeString, asr: TimeString, maghrib: TimeString, isha: TimeString }} SalatTimes
 */

document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({ action: 'NotificationPermissionState' }).then(function (response) {
        if (response && response.hasNotificationPermission) {
            document.getElementById('noti-permission')?.classList.add('hidden');
        } else {
            document.getElementById('noti-permission')?.classList.remove('hidden');
        }
    });

    document.getElementById('btn-time-setter').addEventListener('click', toggleTimeSetter);

    // Load and display saved salat times on popup open
    chrome.storage.local.get(['salatTimes'], function (result) {
        /**
         * @type {SalatTimes} savedTimes
         */
        const savedTimes = result.salatTimes;
        if (savedTimes) {
            displaySavedTimes(savedTimes);
            setAlarms(savedTimes);
        } else {
            toggleTimeSetter();
        }
    });

    function toggleTimeSetter() {
        const currentState = document.getElementById('btn-time-setter').innerText;
        const timeList = document.getElementById('salat-time-list');

        const timeListForm = document.getElementById('salatForm');

        if (currentState === 'Update Times') {
            document.getElementById('btn-time-setter').innerText = 'Cancel';
            timeList?.classList.add('hidden');
            timeListForm?.classList.remove('hidden');
        } else {
            document.getElementById('btn-time-setter').innerText = 'Update Times';
            timeList?.classList.remove('hidden');
            timeListForm?.classList.add('hidden');
        }
    }

    document.getElementById('setReminder').addEventListener('click', function () {
        const fajr = document.getElementById('fajr').value;
        const dhuhr = document.getElementById('dhuhr').value;
        const asr = document.getElementById('asr').value;
        const maghrib = document.getElementById('maghrib').value;
        const isha = document.getElementById('isha').value;

        /**
         * @type {SalatTimes}
         */
        const salatTimes = { fajr, dhuhr, asr, maghrib, isha };

        chrome.storage.local.set({ 'salatTimes': salatTimes }, function () {
            setAlarms(salatTimes);

            displaySavedTimes(salatTimes);
        });

        toggleTimeSetter();
        alert('Reminders set successfully!');
    });

    /**
     * Displays the saved salat times on the popup.
     * @param {SalatTimes} savedTimes
     */
    function displaySavedTimes(savedTimes) {
        if (savedTimes) {
            document.getElementById('fajr').value = savedTimes.fajr || '';
            document.getElementById('dhuhr').value = savedTimes.dhuhr || '';
            document.getElementById('asr').value = savedTimes.asr || '';
            document.getElementById('maghrib').value = savedTimes.maghrib || '';
            document.getElementById('isha').value = savedTimes.isha || '';

            document.getElementById('fajr-time').innerText = humanTime(savedTimes.fajr) || 'Not set';
            document.getElementById('dhuhr-time').innerText = humanTime(savedTimes.dhuhr) || 'Not set';
            document.getElementById('asr-time').innerText = humanTime(savedTimes.asr) || 'Not set';
            document.getElementById('maghrib-time').innerText = humanTime(savedTimes.maghrib) || 'Not set';
            document.getElementById('isha-time').innerText = humanTime(savedTimes.isha) || 'Not set';
        }
    }

    document.getElementById('btn-allow-notification')?.addEventListener('click', function () {
        // Send a message to request notification permissions
        chrome.runtime.sendMessage({ action: 'requestNotificationPermission' });
    });
});

/**
 * Sets the alarms for each salat time.
 *
 * @param {SalatTimes} salatTimes 
 */
function setAlarms(salatTimes) {
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((salat) => {
        setAlarm(salatTimes[salat], salat);
    });
}

/**
 * Sets the alarm for a salat time. If exists, the previous alarm is cleared.
 *
 * @param {TimeString} time The salat time
 * @param {string} name Salat name
 *
 * @returns 
 */
async function setAlarm(time, name) {
    if (!time) return;

    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    const alarm = await chrome.alarms.get(name);

    if (alarm) {
        let scheduledTime = new Date(alarm.scheduledTime);

        if (scheduledTime.getHours() === date.getHours() && scheduledTime.getMinutes() === date.getMinutes()) {
            return;
        }

        chrome.alarms.clear(name);
    }

    chrome.alarms.create(name, {
        when: date.getTime(),
        periodInMinutes: 24 * 60
    });
}

/**
 * Formats the 24-hour time to 12-hour time in human readable way
 *
 * @param {TimeString} time
 * @returns {string}
 */
function humanTime(time) {
    if (!time) return '';

    let [hours, minutes] = time.split(':');
    const ampm = hours >= 12 ? 'pm' : 'am';

    if (hours > 12) { hours -= 12; }

    return `${hours}:${minutes} ${ampm}`;
}
