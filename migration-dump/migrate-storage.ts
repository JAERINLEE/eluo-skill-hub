/**
 * Eluo Skill Hub - Storage 파일 마이그레이션 스크립트
 *
 * 사용법:
 *   1. 아래 4개 변수를 채우세요
 *   2. 프로젝트 루트에서 실행:
 *      npx tsx migration-dump/migrate-storage.ts
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================
// 설정 - 기존/새 프로젝트의 SERVICE_ROLE_KEY를 입력하세요
// Dashboard → Settings → API → service_role (secret)
// ============================================================
const OLD_URL = 'https://rcndirlsdmovufswhlqo.supabase.co'
const OLD_SERVICE_KEY = ''  // ← 기존 프로젝트 service_role key

const NEW_URL = ''          // ← 새 프로젝트 URL (예: https://xxx.supabase.co)
const NEW_SERVICE_KEY = ''  // ← 새 프로젝트 service_role key

// ============================================================

if (!OLD_SERVICE_KEY || !NEW_URL || !NEW_SERVICE_KEY) {
  console.error('오류: OLD_SERVICE_KEY, NEW_URL, NEW_SERVICE_KEY를 입력하세요!')
  process.exit(1)
}

const oldClient = createClient(OLD_URL, OLD_SERVICE_KEY)
const newClient = createClient(NEW_URL, NEW_SERVICE_KEY)

const BUCKETS = ['skill-descriptions', 'skill-templates'] as const

async function migrateFile(bucket: string, path: string): Promise<boolean> {
  const { data, error } = await oldClient.storage.from(bucket).download(path)
  if (error || !data) {
    console.error(`  ✗ 다운로드 실패: ${bucket}/${path} - ${error?.message}`)
    return false
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const { error: uploadError } = await newClient.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType: data.type,
  })

  if (uploadError) {
    console.error(`  ✗ 업로드 실패: ${bucket}/${path} - ${uploadError.message}`)
    return false
  }

  console.log(`  ✓ ${bucket}/${path} (${(buffer.length / 1024).toFixed(1)}KB)`)
  return true
}

async function listAllFiles(bucket: string, prefix: string = ''): Promise<string[]> {
  const paths: string[] = []
  const { data: items, error } = await oldClient.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error || !items) return paths

  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name
    if (!item.id) {
      // 디렉토리 → 재귀 탐색
      const subPaths = await listAllFiles(bucket, fullPath)
      paths.push(...subPaths)
    } else {
      paths.push(fullPath)
    }
  }
  return paths
}

async function migrateBucket(bucket: string) {
  console.log(`\n=== ${bucket} 버킷 마이그레이션 ===`)

  const files = await listAllFiles(bucket)
  if (files.length === 0) {
    console.log('  파일 없음, 건너뜀')
    return { total: 0, success: 0 }
  }

  console.log(`  ${files.length}개 파일 발견`)
  let success = 0
  for (const path of files) {
    if (await migrateFile(bucket, path)) success++
  }

  console.log(`  완료: ${success}/${files.length}`)
  return { total: files.length, success }
}

async function main() {
  console.log('==========================================')
  console.log(' Eluo Skill Hub - Storage 마이그레이션')
  console.log('==========================================')
  console.log(`기존: ${OLD_URL}`)
  console.log(`새로: ${NEW_URL}`)

  let totalFiles = 0
  let totalSuccess = 0

  for (const bucket of BUCKETS) {
    const { total, success } = await migrateBucket(bucket)
    totalFiles += total
    totalSuccess += success
  }

  console.log('\n==========================================')
  console.log(` 완료! ${totalSuccess}/${totalFiles} 파일 이전 성공`)
  console.log('==========================================')

  if (totalSuccess < totalFiles) {
    console.log('\n⚠ 일부 파일 이전 실패. 위 로그를 확인하세요.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
