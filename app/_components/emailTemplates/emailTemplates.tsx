
export const weeklyRankingsEmail = (): string => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Weekly Rankings Report</title>
    <style>
        body {
            background-color: #ffffff;
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.4;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
        .message {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .body {
            font-size: 16px;
            margin-bottom: 20px;
            text-align: left;
        }
        .support {
            font-size: 14px;
            color: #999999;
            margin-top: 20px;
        }
        .highlight {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="message">Weekly Rankings Report</div>
        <div class="body">
            <p>Dear Admin,</p>
            <p>Please find attached the weekly rankings for drivers, riders, and lifetime user points:</p>
            <ul>
                <li><span class="highlight">Weekly Driver Rankings:</span> Based on CEpoints earned from last week's rides.</li>
                <li><span class="highlight">Weekly Rider Rankings:</span> Based on CEpoints earned from last week's ride bookings.</li>
                <li><span class="highlight">Lifetime User Rankings:</span> Based on total CEpoints for all users.</li>
            </ul>
        </div>
        <div class="support">
            If you have any questions or need assistance, please feel free to reach out to us at 
            <a href="mailto:info@pageoptima.com">info@pageoptima.com</a>. We are here to help!
        </div>
    </div>
</body>
</html>`;
};


export const supportTicketEmail = (
    userId: string,
    name: string | null,
    email: string | null,
    phone: string | null,
    message: string
): string => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Support Ticket from User ${userId}</title>
    <style>
        body {
            background-color: #ffffff;
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.4;
            color: #333333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
        .message {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .body {
            font-size: 16px;
            margin-bottom: 20px;
            text-align: left;
        }
        .support {
            font-size: 14px;
            color: #999999;
            margin-top: 20px;
        }
        .highlight {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="message">New Support Ticket</div>
        <div class="body">
            <p>Dear Support Team,</p>
            <p>A new support ticket has been submitted with the following details:</p>
            <ul>
                <li><span class="highlight">User ID:</span> ${userId}</li>
                <li><span class="highlight">Name:</span> ${name || "Unknown"}</li>
                <li><span class="highlight">Email:</span> ${email || "Unknown"}</li>
                <li><span class="highlight">Phone:</span> ${phone || "Unknown"}</li>
                <li><span class="highlight">Message:</span> ${message}</li>
            </ul>
        </div>
        <div class="support">
            For further assistance or to respond to this ticket, please contact the user directly${email || phone
            ? " at" + (email ? ` <a href="mailto:${email}">${email}</a>` : "") + (email && phone ? " or" : "") + (phone ? ` call <a href="tel:${phone}">${phone}</a>` : "")
            : "."
        }
        </div>
    </div>
</body>
</html>`;
};