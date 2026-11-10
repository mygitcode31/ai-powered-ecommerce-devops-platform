
pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Validate Project') {
            steps {
                sh '''
                    set -e
                    test -f docker-compose.yml
                    test -f my-medusa-store/Dockerfile.backend
                    test -f my-medusa-store/Dockerfile.storefront
                    echo "Project validation successful."
                '''
            }
        }

        stage('Check DevOps Tools') {
            steps {
                sh '''
                    git --version
                    docker --version
                    docker compose version
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    docker build \
                      -f my-medusa-store/Dockerfile.backend \
                      -t ecommerce-backend:$IMAGE_TAG \
                      my-medusa-store
                '''
            }
        }

        stage('Build Storefront Image') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    docker build \
                      --secret id=storefront_env,src=/var/lib/jenkins/secure-files/storefront.env \
                      -f my-medusa-store/Dockerfile.storefront \
                      -t ecommerce-storefront:$IMAGE_TAG \
                      my-medusa-store
                '''
            }
        }

        stage('Verify Images') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    docker image inspect ecommerce-backend:$IMAGE_TAG
                    docker image inspect ecommerce-storefront:$IMAGE_TAG

                    echo "Both images verified."
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh '''#!/bin/bash
                    set -Eeuo pipefail

                    PROJECT="ecommerce-devops-platform"
                    IMAGE_TAG=$(git rev-parse --short=12 HEAD)

                    COMPOSE=(docker compose -p "$PROJECT" --env-file /var/lib/jenkins/secure-files/root.env)

                    echo "Recording currently deployed images..."

                    OLD_BACKEND_IMAGE=$(docker inspect -f '{{.Config.Image}}' ecommerce-backend)
                    OLD_STOREFRONT_IMAGE=$(docker inspect -f '{{.Config.Image}}' ecommerce-storefront)

                    cleanup() {
                        rm -f docker/backend.env
                        rm -f my-medusa-store/apps/storefront/.env.local
                    }
                    trap cleanup EXIT

                    echo "Preparing environment files..."

                    install -D -m 600 \
                      /var/lib/jenkins/secure-files/backend.env \
                      docker/backend.env

                    install -D -m 600 \
                      /var/lib/jenkins/secure-files/storefront.env \
                      my-medusa-store/apps/storefront/.env.local

                    "${COMPOSE[@]}" config --quiet

                    wait_healthy() {
                        local container="$1"

                        for i in $(seq 1 30); do
                            STATUS=$(docker inspect -f \
                              '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' \
                              "$container")

                            echo "$container health: $STATUS"

                            if [ "$STATUS" = "healthy" ]; then
                                return 0
                            fi

                            if [ "$STATUS" = "unhealthy" ]; then
                                return 1
                            fi

                            sleep 5
                        done

                        return 1
                    }

                    rollback() {
                        echo "Deployment failed. Rolling back application images..."

                        BACKEND_IMAGE="$OLD_BACKEND_IMAGE" \
                        STOREFRONT_IMAGE="$OLD_STOREFRONT_IMAGE" \
                          "${COMPOSE[@]}" up -d --no-deps --no-build backend storefront

                        echo "Rollback command completed."
                    }

                    echo "Deploying backend image: $IMAGE_TAG"

                    if ! BACKEND_IMAGE="ecommerce-backend:$IMAGE_TAG" \
                         STOREFRONT_IMAGE="ecommerce-storefront:$IMAGE_TAG" \
                         "${COMPOSE[@]}" up -d --no-deps --no-build backend; then
                        rollback
                        exit 1
                    fi

                    if ! wait_healthy ecommerce-backend; then
                        rollback
                        exit 1
                    fi

                    echo "Backend is healthy. Deploying storefront..."

                    if ! BACKEND_IMAGE="ecommerce-backend:$IMAGE_TAG" \
                         STOREFRONT_IMAGE="ecommerce-storefront:$IMAGE_TAG" \
                         "${COMPOSE[@]}" up -d --no-deps --no-build storefront; then
                        rollback
                        exit 1
                    fi

                    if ! wait_healthy ecommerce-storefront; then
                        rollback
                        exit 1
                    fi

                    echo "Checking application endpoints..."

                    if ! curl -fsS http://localhost:9000/health; then
                        rollback
                        exit 1
                    fi

                    if ! curl -fsSI http://localhost:8000; then
                        rollback
                        exit 1
                    fi

                    echo "Deployment successful: $IMAGE_TAG"
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the console output.'
        }
    }
}
