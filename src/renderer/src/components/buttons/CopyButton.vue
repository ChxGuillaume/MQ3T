<script setup lang="ts">
defineEmits(['click'])
</script>

<template>
  <q-btn size="sm" color="secondary" flat round icon="fa-solid fa-copy" @click="$emit('click')" />
</template>

<style scoped lang="less"></style>
