const tests = [
  "Khi thực hiện arr.astype(np.int32) trên mảng [3.7, -1.2, -2.6], kết quả nào sau đây là đúng?",
  "Sử dụng pd.DataFrame() để tạo.",
  "gọi hàm print(hello)",
  "Ví dụ như A.B",
  "Trong file test.txt nhé.",
  "Phương thức get_dummies() thì sao?"
];

const regex = /`([^`]+)`|'([^'\n]{1,120})'|([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?)|(\[[0-9., \-']+\])/g;

tests.forEach(t => {
  console.log("TEXT:", t);
  let match;
  while ((match = regex.exec(t)) !== null) {
      console.log(" MATCH:", match[0], "| G1:", match[1], "| G2:", match[2], "| G3:", match[3], "| G4:", match[4]);
  }
});
