# Glue2

> 为什么忽然又有文档了？我不知道。 ☮️ 


Glue的设计目标是辅助定义「用于同步、控制、广播」的状态对象。

### ~~符合直觉~~：

~~本地定义的「对象」，在标记为Glue对象后，与远程完全同步。~~


~~对象中的「函数」，可在「远程、或本地」被调用（GlueAction）。~~
~~对象中的「事件」，可在「本地接收」，并在「本地」或「远程」（远程服务器可决定是否将这个事件Route到其他地方）。~~

### 清晰可用
---

### 可检索、软化代码：（你不一定觉得好，但我真的需要）
---

在标记为Glue对象后，将对象内的Key:Value 转化为 `属性Uri`。

```javascript
{ 
    sample_obj: 0,
    some_event: glueEvent(/*constrains*/)
}
//generates:

"/sample_obj" => 0 
"/some_event" => eventEmitter
```

在其他地方（或者任意地方）

```javascript
glueSet("/sample_obj", 10);
```

或者在远程？
```javascript
await glueSet("/some_program_id/sample_obj", 10);
```

软化之后的调用，什么是本地？什么是远程？看起来不是特别重要。方便后期Bindable的设计。

更便于~~Socket.io~~ Service Mesh 来接入。

---
