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
      defaultValue: true,
      description: 'Send email notification after build completion'
    )
    booleanParam(
      name: 'NOTIFY_SLACK',
      defaultValue: true,
      description: 'Send Slack notification after build completion'
    )
  }

  environment {
    NODE_ENV = 'test'
    REPORT_DIR = 'reports'
    CI = 'true'
    EMAIL_RECIPIENTS = credentials('EMAIL_RECIPIENTS')
    SLACK_CHANNEL = credentials('SLACK_CHANNEL')
    SLACK_TOKEN_CREDENTIAL_ID = 'slack-token'
  }

  options {
    timestamps()
    ansiColor('xterm')
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
          try {
            sh 'mkdir -p reports'
            sh "API_BASE_URL='${params.API_BASE_URL}' npm test -- --format json:reports/cucumber-report.json"
          } catch (err) {
            currentBuild.result = 'FAILURE'
            throw err
          }
        }
      }
    }

    stage('Generate HTML report') {
      steps {
        sh 'npx mchr'
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
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
    }

    success {
      script {
        notifyBuildStatus('SUCCESS')
      }
    }

    failure {
      script {
        notifyBuildStatus('FAILURE')
      }
    }
    unstable {
      script {
        notifyBuildStatus('UNSTABLE')
      }
    }
  }
}

void notifyBuildStatus(String status) {
  def subject = "${env.JOB_NAME} #${env.BUILD_NUMBER} - ${status}"
  def body = """
    <p>Build: ${env.JOB_NAME} #${env.BUILD_NUMBER}</p>
    <p>Status: ${status}</p>
    <p>Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'}</p>
    <p>Environment: ${params.ENVIRONMENT}</p>
    <p>Report: <a href='${env.BUILD_URL}artifact/reports/html/index.html'>Open HTML report</a></p>
  """

  if (params.NOTIFY_EMAIL && env.EMAIL_RECIPIENTS?.trim()) {
    emailext(
      to: env.EMAIL_RECIPIENTS,
      subject: subject,
      body: body,
      mimeType: 'text/html'
    )
  }

  if (params.NOTIFY_SLACK && env.SLACK_CHANNEL?.trim()) {
    slackSend(
      channel: env.SLACK_CHANNEL,
      color: status == 'SUCCESS' ? 'good' : status == 'FAILURE' ? 'danger' : 'warning',
      message: "${env.JOB_NAME} #${env.BUILD_NUMBER} - ${status} | Branch: ${params.BRANCH_TO_TEST ?: env.BRANCH_NAME ?: 'N/A'} | Environment: ${params.ENVIRONMENT} | Report: ${env.BUILD_URL}artifact/reports/html/index.html"
    )
  }
}
