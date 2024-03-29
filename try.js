function threeSum(nums, target) {
  const result = [];

  // Sort the array to use two pointers technique
  nums.sort((a, b) => a - b);

  for (let i = 0; i < nums.length - 2; i++) {
    // Skip duplicates
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;
    console.log({ left, right });
    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === target) {
        result.push([nums[i], nums[left], nums[right]]);

        // Skip duplicates
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < target) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}


// -5 , -1 , 1 , 1 , 2 , 4
const nums = [1, 2, 1, 4, -1, -5];
const target = -2;
const result = threeSum(nums, target);
console.log(`Triplets that sum up to ${target}:`);
result.forEach((triplet) => {
  console.log(triplet);
});
