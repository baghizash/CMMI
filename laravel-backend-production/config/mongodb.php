<?php

return [
    'default' => env('MONGODB_CONNECTION', 'mongodb'),

    'connections' => [
        'mongodb' => [
            'driver' => 'mongodb',
            'dsn' => env('MONGODB_URI', 'mongodb://localhost:27017'),
            'database' => env('MONGODB_DATABASE', 'school_attendance_db'),
            'options' => [
                'connect' => true,
            ]
        ],
    ],
];
