<script setup lang="ts">
/**
 * Reads an IPS QR from an image file, a pasted screenshot or the camera.
 * Everything is decoded locally with jsQR.
 */
import jsQR from 'jsqr'

const emit = defineEmits<{ decoded: [payload: string] }>()
const { t } = useI18n()

const status = ref<'idle' | 'scanning' | 'notFound' | 'noCamera'>('idle')
const video = ref<HTMLVideoElement>()
let stream: MediaStream | undefined
let raf = 0

function decodeImageData(data: ImageData): string | null {
  return jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

async function decodeFile(file: File) {
  const bitmap = await createImageBitmap(file)
  // Large photos are downscaled: jsQR is faster and just as accurate at ~1600px.
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const result = decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
  if (result) {
    status.value = 'idle'
    emit('decoded', result)
  }
  else {
    status.value = 'notFound'
  }
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) decodeFile(file)
  ;(e.target as HTMLInputElement).value = ''
}

function onPaste(e: ClipboardEvent) {
  const file = [...(e.clipboardData?.files ?? [])].find(f => f.type.startsWith('image/'))
  if (file) decodeFile(file)
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  }
  catch {
    status.value = 'noCamera'
    return
  }
  status.value = 'scanning'
  await nextTick()
  video.value!.srcObject = stream
  await video.value!.play()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const tick = () => {
    const v = video.value
    if (!v || status.value !== 'scanning') return
    if (v.readyState >= 2) {
      canvas.width = v.videoWidth
      canvas.height = v.videoHeight
      ctx.drawImage(v, 0, 0)
      const result = decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
      if (result) {
        stopCamera()
        emit('decoded', result)
        return
      }
    }
    raf = requestAnimationFrame(tick)
  }
  tick()
}

function stopCamera() {
  cancelAnimationFrame(raf)
  stream?.getTracks().forEach(tr => tr.stop())
  stream = undefined
  if (status.value === 'scanning') status.value = 'idle'
}

onMounted(() => window.addEventListener('paste', onPaste))
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  stopCamera()
})
</script>

<template>
  <div class="qr-import">
    <div class="buttons">
      <label class="btn">
        <input
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFile"
        >
        {{ t('import.fromImage') }}
      </label>
      <button
        v-if="status !== 'scanning'"
        type="button"
        class="btn"
        @click="startCamera"
      >
        {{ t('import.fromCamera') }}
      </button>
      <button
        v-else
        type="button"
        class="btn"
        @click="stopCamera"
      >
        {{ t('import.stop') }}
      </button>
    </div>
    <p class="hint">
      {{ t('import.pasteHint') }}
    </p>
    <video
      v-show="status === 'scanning'"
      ref="video"
      class="camera"
      muted
      playsinline
    />
    <p
      v-if="status === 'notFound'"
      class="verdict bad"
      role="alert"
    >
      ✕ {{ t('import.notFound') }}
    </p>
    <p
      v-if="status === 'noCamera'"
      class="verdict bad"
      role="alert"
    >
      ✕ {{ t('import.noCamera') }}
    </p>
  </div>
</template>

<style scoped>
.qr-import { display: grid; gap: var(--s-3); }
.qr-import > * { margin: 0; }
.buttons { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.buttons label.btn:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
.hint { font-size: var(--fs-xs); color: var(--text-muted); }
.camera { width: 100%; max-width: 420px; border-radius: var(--r-sm); background: var(--text); }
</style>
