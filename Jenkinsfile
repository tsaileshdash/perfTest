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
                    mkdir -p reports
                    npm test -- --format json:reports/cucumber-report.json
                '''
            }
        }

        stage('Generate HTML report') {
            steps {
                sh '''
                    npx mchr
                '''
            }
        }

        stage('Publish HTML report') {
            steps {
                publishHTML(target: [
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports/html',
                    reportFiles: 'index.html',
                    reportName: 'Acceptance Test Report'
                ])
            }
        }

        stage('Archive test artifacts') {
            steps {
                archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
            }
        }
    }
}
