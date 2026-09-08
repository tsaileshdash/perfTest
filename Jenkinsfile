pipeline {
  agent any

  triggers {
    githubPush()
  }

  parameters {
    choice(
      name: 'BRANCH_TO_TEST',
      choices: ['main', 'develop', 'release', 'feature/api-tests'],
      description: 'Select the branch to check out and test'
    )
    choice(
      name: 'ENVIRONMENT',
      choices: ['dev', 'qa', 'staging', 'prod'],
      description: 'Target environment for the API validation run'
    )
    string(
      name: 'API_BASE_URL',
      defaultValue: 'https://fakerestapi.azurewebsites.net/api/v1',
      description: 'Base URL for the API under test'
    )
    booleanParam(
      name: 'NOTIFY_EMAIL',
      defaultValue: false,
      description: 'Send email notification after build completion'
    )
    booleanParam(
      name: 'NOTIFY_SLACK',
      defaultValue: false,
      description: 'Send Slack notification after build completion'
    )
  }

  environment {
    NODE_ENV = 'test'
    REPORT_DIR = 'reports'
    CI = 'true'
    PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Branch guard') {
      steps {
        script {
          def allowedBranches = ['main', 'develop', 'release', 'feature/*']
          def branchToRun = params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'main'
          def currentBranch = env.BRANCH_NAME ?: branchToRun

          if (env.BRANCH_NAME) {
            def branchMatches = allowedBranches.any { pattern ->
              if (pattern.endsWith('/*')) {
                return currentBranch.startsWith(pattern.replace('/*', ''))
              }
              return currentBranch == pattern
            }

            if (!branchMatches) {
              echo "Skipping push-triggered build for branch '${currentBranch}'. Only these branches are allowed: ${allowedBranches.join(', ')}"
              currentBuild.result = 'ABORTED'
              error("Build aborted for non-approved branch: ${currentBranch}")
            }
          }

          echo "Selected branch to test: ${branchToRun}"
          echo "Environment: ${params.ENVIRONMENT}"
          echo "API Base URL: ${params.API_BASE_URL}"
        }
      }
    }

    stage('Checkout') {
      steps {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'main'}"]],
          userRemoteConfigs: [[url: scm.userRemoteConfigs[0].url]],
          extensions: []
        ])
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm install'
      }
    }

    stage('Run acceptance tests') {
      steps {
        script {
          catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
            sh 'mkdir -p reports'
            sh "API_BASE_URL='${params.API_BASE_URL}' npm test -- --format json:reports/cucumber-report.json"
          }
        }
      }
    }

    stage('Generate HTML report') {
      steps {
        sh '''
          if [ -f reports/cucumber-report.json ]; then
            npx mchr
          else
            echo "No cucumber JSON report found; skipping HTML generation"
          fi
        '''
      }
    }

    stage('Publish HTML report') {
      steps {
        publishHTML(target: [
          allowMissing: true,
          alwaysLinkToLastBuild: true,
          keepAll: true,
          reportDir: 'reports/html',
          reportFiles: 'index.html',
          reportName: 'Acceptance Test Report'
        ])
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
    }

    success {
      script {
        if (params.NOTIFY_EMAIL) {
          withCredentials([string(credentialsId: 'EMAIL_RECIPIENTS', variable: 'EMAIL_RECIPIENTS')]) {
            if (env.EMAIL_RECIPIENTS?.trim()) {
              def subject = "${env.JOB_NAME} #${env.BUILD_NUMBER} - SUCCESS"
              def body = """
                <p>Build: ${env.JOB_NAME} #${env.BUILD_NUMBER}</p>
                <p>Status: SUCCESS</p>
                <p>Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'}</p>
                <p>Environment: ${params.ENVIRONMENT}</p>
                <p>Report: <a href='${env.BUILD_URL}artifact/reports/html/index.html'>Open HTML report</a></p>
              """
              emailext(
                to: env.EMAIL_RECIPIENTS,
                subject: subject,
                body: body,
                mimeType: 'text/html'
              )
            }
          }
        }

        if (params.NOTIFY_SLACK) {
          withCredentials([string(credentialsId: 'SLACK_CHANNEL', variable: 'SLACK_CHANNEL')]) {
            if (env.SLACK_CHANNEL?.trim()) {
              slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'good',
                message: "${env.JOB_NAME} #${env.BUILD_NUMBER} - SUCCESS | Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'} | Environment: ${params.ENVIRONMENT} | Report: ${env.BUILD_URL}artifact/reports/html/index.html"
              )
            }
          }
        }
      }
    }

    failure {
      script {
        if (params.NOTIFY_EMAIL) {
          withCredentials([string(credentialsId: 'EMAIL_RECIPIENTS', variable: 'EMAIL_RECIPIENTS')]) {
            if (env.EMAIL_RECIPIENTS?.trim()) {
              def subject = "${env.JOB_NAME} #${env.BUILD_NUMBER} - FAILURE"
              def body = """
                <p>Build: ${env.JOB_NAME} #${env.BUILD_NUMBER}</p>
                <p>Status: FAILURE</p>
                <p>Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'}</p>
                <p>Environment: ${params.ENVIRONMENT}</p>
                <p>Report: <a href='${env.BUILD_URL}artifact/reports/html/index.html'>Open HTML report</a></p>
              """
              emailext(
                to: env.EMAIL_RECIPIENTS,
                subject: subject,
                body: body,
                mimeType: 'text/html'
              )
            }
          }
        }

        if (params.NOTIFY_SLACK) {
          withCredentials([string(credentialsId: 'SLACK_CHANNEL', variable: 'SLACK_CHANNEL')]) {
            if (env.SLACK_CHANNEL?.trim()) {
              slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'danger',
                message: "${env.JOB_NAME} #${env.BUILD_NUMBER} - FAILURE | Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'} | Environment: ${params.ENVIRONMENT} | Report: ${env.BUILD_URL}artifact/reports/html/index.html"
              )
            }
          }
        }
      }
    }

    unstable {
      script {
        if (params.NOTIFY_EMAIL) {
          withCredentials([string(credentialsId: 'EMAIL_RECIPIENTS', variable: 'EMAIL_RECIPIENTS')]) {
            if (env.EMAIL_RECIPIENTS?.trim()) {
              def subject = "${env.JOB_NAME} #${env.BUILD_NUMBER} - UNSTABLE"
              def body = """
                <p>Build: ${env.JOB_NAME} #${env.BUILD_NUMBER}</p>
                <p>Status: UNSTABLE</p>
                <p>Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'}</p>
                <p>Environment: ${params.ENVIRONMENT}</p>
                <p>Report: <a href='${env.BUILD_URL}artifact/reports/html/index.html'>Open HTML report</a></p>
              """
              emailext(
                to: env.EMAIL_RECIPIENTS,
                subject: subject,
                body: body,
                mimeType: 'text/html'
              )
            }
          }
        }

        if (params.NOTIFY_SLACK) {
          withCredentials([string(credentialsId: 'SLACK_CHANNEL', variable: 'SLACK_CHANNEL')]) {
            if (env.SLACK_CHANNEL?.trim()) {
              slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'warning',
                message: "${env.JOB_NAME} #${env.BUILD_NUMBER} - UNSTABLE | Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'} | Environment: ${params.ENVIRONMENT} | Report: ${env.BUILD_URL}artifact/reports/html/index.html"
              )
            }
          }
        }
      }
    }
  }
}
