pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        ENV = "dev"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Node and npm') {
            steps {
                sh '''
                    echo "PATH=$PATH"

                    echo "Node:"
                    which node
                    node --version

                    echo "npm:"
                    which npm
                    npm --version
                '''
            }
        }

        stage('Install dependencies') {
            steps {
                sh '''
                    npm install
                '''
            }
        }

        stage('Run acceptance tests') {
            steps {
                sh '''
                    npm test
                '''
            }
        }
    }
}
