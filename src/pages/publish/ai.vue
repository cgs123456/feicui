<template>
  <div class="page-container">
    <AppNavbar title="AI 生成商品信息" fallback="/merchant/publish" />

    <div class="ai-content">
      <div class="card">
        <p class="intro-text">输入商品关键词，AI 将自动为您生成标题、描述和标签。</p>

        <van-field
          v-model="keyword"
          type="textarea"
          placeholder="例如：冰种翡翠手镯、缅甸A货、58圈口"
          rows="3"
          autosize
          class="keyword-input"
        />

        <van-button
          type="primary"
          block
          round
          :loading="loading"
          :disabled="!keyword.trim()"
          @click="generateAI"
          class="generate-btn"
        >
          {{ loading ? 'AI 生成中...' : 'AI 智能生成' }}
        </van-button>
      </div>

      <div v-if="result" class="card result-card">
        <h3 class="result-title">生成结果</h3>

        <div class="field-row">
          <span class="field-label">商品标题</span>
          <span class="field-value">{{ result.title }}</span>
        </div>

        <div class="field-row">
          <span class="field-label">商品描述</span>
          <span class="field-value textarea-value">{{ result.description }}</span>
        </div>

        <div class="field-row">
          <span class="field-label">推荐标签</span>
          <div class="tag-list">
            <span v-for="tag in result.tags" :key="tag" class="tag-item">{{ tag }}</span>
          </div>
        </div>

        <div class="action-row">
          <van-button type="primary" round @click="applyToPublish">
            <van-icon name="plus" /> 应用到发布表单
          </van-button>
          <van-button plain round @click="regenerate">重新生成</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import AppNavbar from '../../components/AppNavbar.vue'

const router = useRouter()
const keyword = ref('')
const loading = ref(false)
const result = ref(null)

const materials = ['玻璃种', '冰种', '糯种', '帝王绿', '紫罗兰', '飘花', '黄翡', '红翡']
const categories = ['手镯', '戒指', '吊坠', '挂件', '项链', '平安扣', '手链', '耳饰']

function generateAI() {
  if (!keyword.value.trim()) return
  loading.value = true

  setTimeout(() => {
    const kw = keyword.value
    const matchedMaterial = materials.find(m => kw.includes(m)) || '冰种'
    const matchedCategory = categories.find(c => kw.includes(c)) || '挂件'

    result.value = {
      title: `高冰种${matchedMaterial}翡翠${matchedCategory} 天然缅甸A货`,
      description: `精选缅甸天然A货翡翠${matchedCategory}，${matchedMaterial}质地通透水润，色泽均匀。纹理细腻，无裂纹无棉絮，佩戴舒适。附权威机构鉴定证书，适合日常佩戴与收藏。`,
      tags: [matchedMaterial, `翡翠${matchedCategory}`, '缅甸A货', '附证书', '送礼佳品']
    }

    loading.value = false
  }, 1500)
}

function applyToPublish() {
  // 存储到 sessionStorage 以便 publish 页面读取
  sessionStorage.setItem('aiGenerated', JSON.stringify(result.value))
  showToast('已应用，跳转到发布页')
  router.push('/merchant/publish')
}

function regenerate() {
  result.value = null
  generateAI()
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
}

.ai-content {
  padding: 16px;
}

.card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.intro-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.6;
}

.keyword-input {
  margin-bottom: 16px;
  padding: 0;
  background: #f8f8f8;
  border-radius: 8px;
}

.generate-btn {
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
}

.result-card {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.field-row {
  margin-bottom: 14px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.field-value {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.textarea-value {
  background: #f8f8f8;
  border-radius: 6px;
  padding: 8px 10px;
  display: block;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  background: #e8f8ef;
  color: #07c160;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.action-row .van-button {
  flex: 1;
  height: 38px;
}
</style>
